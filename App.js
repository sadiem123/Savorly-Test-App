import * as React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Easing, ScrollView, TextInput, Alert, ActivityIndicator, Image } from 'react-native'; 
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Define navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createStackNavigator();

// ============================================================================
// AUTHENTICATION CONTEXT & HOOKS
// ============================================================================

const AuthContext = React.createContext();

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Check for existing auth token
    // TODO: Implement actual token check
    const checkAuth = async () => {
      // Simulate auth check
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    };
    checkAuth();
  }, []);

  const signIn = async (email, password) => {
    // TODO: Implement actual sign in
    setUser({ id: '1', email, role: 'student' });
    return { success: true };
  };

  const signUp = async (email, password, userData) => {
    // TODO: Implement actual sign up
    setUser({ id: '1', email, ...userData, role: 'student' });
    return { success: true };
  };

  const signOut = async () => {
    // TODO: Implement actual sign out
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// AUTHENTICATION SCREENS
// ============================================================================

function SignInScreen() {
  const navigation = useNavigation();
  const { signIn } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      // Navigation handled by AuthProvider state change
    } catch (error) {
      Alert.alert('Sign In Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleCalNetSignIn = () => {
    // TODO: Implement CalNet SSO
    Alert.alert('CalNet SSO', 'CalNet authentication will be implemented');
  };

  return (
    <ScrollView style={styles.authContainer} contentContainerStyle={styles.authContent}>
      <View style={styles.authHeader}>
        <Text style={styles.authTitle}>Welcome to Savorly</Text>
        <Text style={styles.authSubtitle}>Eat better, spend less, waste none.</Text>
      </View>

      <View style={styles.authForm}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your.email@berkeley.edu"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

              <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleCalNetSignIn}
              >
          <Text style={styles.secondaryButtonText}>Sign In with CalNet</Text>
              </TouchableOpacity>

              <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('ForgotPassword')}
              >
          <Text style={styles.linkText}>Forgot Password?</Text>
              </TouchableOpacity>

        <View style={styles.authDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

              <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('SignUp')}
              >
          <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
              </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function SignUpScreen() {
  const navigation = useNavigation();
  const { signUp } = useAuth();
  const [step, setStep] = React.useState(1);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSNAPRecipient, setIsSNAPRecipient] = React.useState(false);
  const [year, setYear] = React.useState('');
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleNext = () => {
    if (step === 1) {
      if (!email || !password || !confirmPassword) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      handleSignUp();
    }
  };

  const handleSignUp = async () => {
    if (!name) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, {
        name,
        isSNAPRecipient,
        year,
      });
      // Navigation handled by AuthProvider
    } catch (error) {
      Alert.alert('Sign Up Failed', error.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.authContainer} contentContainerStyle={styles.authContent}>
      <View style={styles.authHeader}>
        <Text style={styles.authTitle}>Create Account</Text>
        <Text style={styles.authSubtitle}>Step {step} of 3</Text>
      </View>

      {step === 1 && (
        <View style={styles.authForm}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Berkeley Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your.email@berkeley.edu"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
        </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
      </View>
      )}

      {step === 2 && (
        <View style={styles.authForm}>
          <Text style={styles.sectionTitle}>Tell us about yourself</Text>
          
          <TouchableOpacity
            style={[styles.toggleButton, isSNAPRecipient && styles.toggleButtonActive]}
            onPress={() => setIsSNAPRecipient(!isSNAPRecipient)}
          >
            <Text style={[styles.toggleButtonText, isSNAPRecipient && styles.toggleButtonTextActive]}>
              Are you a SNAP recipient?
            </Text>
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Year</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Freshman, Sophomore, Junior, Senior, Graduate"
              placeholderTextColor="#999"
              value={year}
              onChangeText={setYear}
            />
              </View>
              </View>
      )}

      {step === 3 && (
        <View style={styles.authForm}>
          <Text style={styles.sectionTitle}>Create Your Profile</Text>
          
          <TouchableOpacity style={styles.imageUploadButton}>
            <Text style={styles.imageUploadText}>📷 Upload Profile Image</Text>
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
            </View>
            </View>
      )}

      <View style={styles.authForm}>
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {step === 3 ? 'Complete Sign Up' : 'Next'}
            </Text>
          )}
          </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
  );
}

function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    // TODO: Implement password reset
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Password reset email sent!');
      navigation.goBack();
    }, 1000);
  };

  return (
    <ScrollView style={styles.authContainer} contentContainerStyle={styles.authContent}>
      <View style={styles.authHeader}>
        <Text style={styles.authTitle}>Reset Password</Text>
        <Text style={styles.authSubtitle}>Enter your email to receive a reset link</Text>
    </View>

      <View style={styles.authForm}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your.email@berkeley.edu"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ============================================================================
// MAIN APP SCREENS
// ============================================================================

function HomeScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFilters, setSelectedFilters] = React.useState([]);
  const [viewMode, setViewMode] = React.useState('list'); // 'list' or 'map'

  // Sample listings data
  const listings = [
    {
      id: 1,
      restaurant: 'Campus Cafe',
      name: 'Veggie Wrap',
      price: 8.99,
      discountPrice: 6.29,
      category: 'Sandwiches',
      dietaryTags: ['Vegetarian', 'Gluten Free'],
      serves: 1,
      availableUntil: '2:00 PM',
      imageUrl: null,
    },
    {
      id: 2,
      restaurant: 'Pizza Palace',
      name: 'Large Pizza',
      price: 18.99,
      discountPrice: 9.50,
      category: 'Italian',
      dietaryTags: ['Vegetarian'],
      serves: 4,
      availableUntil: '1:00 PM',
      imageUrl: null,
    },
    {
      id: 3,
      restaurant: 'Green Bowl',
      name: 'Acai Bowl',
      price: 7.99,
      discountPrice: 5.59,
      category: 'Healthy',
      dietaryTags: ['Vegan', 'Gluten Free'],
      serves: 1,
      availableUntil: '3:00 PM',
      imageUrl: null,
    },
  ];

  const filters = ['Vegetarian', 'Gluten Free', 'Vegan', 'Serves 4+'];

  const toggleFilter = (filter) => {
    if (selectedFilters.includes(filter)) {
      setSelectedFilters(selectedFilters.filter(f => f !== filter));
    } else {
      setSelectedFilters([...selectedFilters, filter]);
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.restaurant.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilters = selectedFilters.length === 0 || 
                          selectedFilters.some(filter => listing.dietaryTags.includes(filter)) ||
                          (selectedFilters.includes('Serves 4+') && listing.serves >= 4);
    return matchesSearch && matchesFilters;
  });

  return (
    <View style={styles.homeContainer}>
      <View style={styles.homeHeader}>
        <Text style={styles.homeTitle}>Browse Food</Text>
        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>
              List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'map' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('map')}
          >
            <Text style={[styles.viewModeText, viewMode === 'map' && styles.viewModeTextActive]}>
              Map
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants or menu items..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedFilters.includes(filter) && styles.filterChipActive,
            ]}
            onPress={() => toggleFilter(filter)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilters.includes(filter) && styles.filterChipTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {viewMode === 'list' ? (
        <ScrollView style={styles.listingsContainer} showsVerticalScrollIndicator={false}>
          {filteredListings.map((listing) => (
            <TouchableOpacity
              key={listing.id}
              style={styles.listingCard}
              onPress={() => navigation.navigate('ListingDetail', { listingId: listing.id })}
            >
              <View style={styles.listingImage}>
                <Text style={styles.listingImagePlaceholder}>🍽️</Text>
                  </View>
              <View style={styles.listingInfo}>
                <Text style={styles.listingName}>{listing.name}</Text>
                <Text style={styles.listingRestaurant}>{listing.restaurant}</Text>
                <View style={styles.listingTags}>
                  {listing.dietaryTags.map((tag, idx) => (
                    <View key={idx} style={styles.listingTag}>
                      <Text style={styles.listingTagText}>{tag}</Text>
                </View>
                  ))}
                </View>
                <View style={styles.listingFooter}>
                  <View style={styles.listingPrice}>
                    <Text style={styles.listingOldPrice}>${listing.price.toFixed(2)}</Text>
                    <Text style={styles.listingNewPrice}>${listing.discountPrice.toFixed(2)}</Text>
              </View>
                  <Text style={styles.listingTime}>⏰ Until {listing.availableUntil}</Text>
                  </View>
              </View>
            </TouchableOpacity>
          ))}
      </ScrollView>
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>📍 Map View</Text>
          <Text style={styles.mapPlaceholderHint}>Map integration coming soon</Text>
        </View>
      )}
    </View>
  );
}

function ListingDetailScreen({ route }) {
  const navigation = useNavigation();
  const { listingId } = route.params;
  const [isReserved, setIsReserved] = React.useState(false);

  // Sample listing detail
  const listing = {
    id: listingId,
    restaurant: 'Campus Cafe',
    name: 'Veggie Wrap',
    description: 'Fresh vegetables wrapped in a whole wheat tortilla with hummus and greens.',
    price: 8.99,
    discountPrice: 6.29,
    category: 'Sandwiches',
    dietaryTags: ['Vegetarian', 'Gluten Free'],
    serves: 1,
    availableUntil: '2:00 PM',
    restaurantHours: 'Mon-Fri: 8am-8pm',
    restaurantAddress: '123 University Ave, Berkeley',
    restaurantPhone: '(555) 123-4567',
  };

  const handleReserve = () => {
    Alert.alert(
      'Reserve Item',
      `Reserve ${listing.name} from ${listing.restaurant}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reserve',
          onPress: () => {
            setIsReserved(true);
            Alert.alert('Success', 'Item reserved! You will be notified when ready for pickup.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.detailContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.detailHeader}>
          <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          >
          <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
      </View>

      <View style={styles.detailImage}>
        <Text style={styles.detailImagePlaceholder}>🍽️</Text>
            </View>

      <View style={styles.detailContent}>
        <Text style={styles.detailName}>{listing.name}</Text>
        <Text style={styles.detailRestaurant}>{listing.restaurant}</Text>
        <Text style={styles.detailDescription}>{listing.description}</Text>

        <View style={styles.detailTags}>
          {listing.dietaryTags.map((tag, idx) => (
            <View key={idx} style={styles.detailTag}>
              <Text style={styles.detailTagText}>{tag}</Text>
          </View>
        ))}
        </View>

        <View style={styles.detailPricing}>
          <Text style={styles.detailOldPrice}>${listing.price.toFixed(2)}</Text>
          <Text style={styles.detailNewPrice}>${listing.discountPrice.toFixed(2)}</Text>
                    </View>

        <View style={styles.detailInfo}>
          <Text style={styles.detailInfoText}>⏰ Available until {listing.availableUntil}</Text>
          <Text style={styles.detailInfoText}>👥 Serves {listing.serves}</Text>
                  </View>

        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantInfoTitle}>Restaurant Info</Text>
          <Text style={styles.restaurantInfoText}>📍 {listing.restaurantAddress}</Text>
          <Text style={styles.restaurantInfoText}>📞 {listing.restaurantPhone}</Text>
          <Text style={styles.restaurantInfoText}>🕐 {listing.restaurantHours}</Text>
                  </View>

              <TouchableOpacity
          style={[styles.reserveButton, isReserved && styles.reserveButtonDisabled]}
          onPress={handleReserve}
          disabled={isReserved}
        >
          <Text style={styles.reserveButtonText}>
            {isReserved ? 'Reserved ✓' : 'Reserve This Item'}
          </Text>
              </TouchableOpacity>
          </View>
      </ScrollView>
  );
}

function CreateListingScreen() {
  const navigation = useNavigation();
  const [step, setStep] = React.useState(1);
  const [images, setImages] = React.useState([]);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [discountPrice, setDiscountPrice] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [dietaryTags, setDietaryTags] = React.useState([]);
  const [serves, setServes] = React.useState('1');

  const handleImagePick = () => {
    // TODO: Implement image picker
    Alert.alert('Image Picker', 'Image upload will be implemented');
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    Alert.alert('Success', 'Listing created!');
    navigation.goBack();
  };

  const availableTags = ['Vegetarian', 'Vegan', 'Gluten Free', 'Dairy Free'];

  return (
    <ScrollView style={styles.createContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.createHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.createTitle}>Create Listing</Text>
        <Text style={styles.createStep}>Step {step} of 3</Text>
      </View>

      {step === 1 && (
        <View style={styles.createForm}>
          <Text style={styles.sectionTitle}>Add Photos</Text>
          <TouchableOpacity style={styles.imageUploadButton} onPress={handleImagePick}>
            <Text style={styles.imageUploadText}>📷 Add Photo</Text>
          </TouchableOpacity>
          </View>
      )}

      {step === 2 && (
        <View style={styles.createForm}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Item Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Veggie Wrap"
              value={name}
              onChangeText={setName}
            />
        </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your item..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
      </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, styles.inputHalf]}>
              <Text style={styles.inputLabel}>Original Price *</Text>
              <TextInput
                style={styles.input}
                placeholder="$0.00"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
        </View>

            <View style={[styles.inputContainer, styles.inputHalf]}>
              <Text style={styles.inputLabel}>Discounted Price *</Text>
              <TextInput
                style={styles.input}
                placeholder="$0.00"
                value={discountPrice}
                onChangeText={setDiscountPrice}
                keyboardType="decimal-pad"
              />
        </View>
        </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Category</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Sandwiches, Salads"
              value={category}
              onChangeText={setCategory}
            />
      </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Serves</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              value={serves}
              onChangeText={setServes}
              keyboardType="number-pad"
            />
              </View>
      </View>
      )}

      {step === 3 && (
        <View style={styles.createForm}>
          <Text style={styles.sectionTitle}>Dietary Tags</Text>
          <View style={styles.tagsContainer}>
            {availableTags.map((tag) => (
          <TouchableOpacity
                key={tag}
                style={[
                  styles.tagChip,
                  dietaryTags.includes(tag) && styles.tagChipActive,
                ]}
            onPress={() => {
                  if (dietaryTags.includes(tag)) {
                    setDietaryTags(dietaryTags.filter(t => t !== tag));
                  } else {
                    setDietaryTags([...dietaryTags, tag]);
                  }
                }}
              >
                <Text
                  style={[
                    styles.tagChipText,
                    dietaryTags.includes(tag) && styles.tagChipTextActive,
                  ]}
                >
                  {tag}
                </Text>
          </TouchableOpacity>
        ))}
      </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Preview</Text>
            <Text style={styles.previewText}>{name || 'Item Name'}</Text>
            <Text style={styles.previewText}>
              ${discountPrice || '0.00'} (was ${price || '0.00'})
            </Text>
          </View>
        </View>
      )}

      <View style={styles.createActions}>
        {step > 1 && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleNext}
        >
          <Text style={styles.primaryButtonText}>
            {step === 3 ? 'Create Listing' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function MessagesScreen() {
  const navigation = useNavigation();
  const [conversations, setConversations] = React.useState([
    {
      id: 1,
    name: 'Campus Cafe',
      lastMessage: 'Your order is ready for pickup!',
      timestamp: '2m ago',
      unread: true,
    },
    {
      id: 2,
      name: 'Pizza Palace',
      lastMessage: 'Thanks for your order!',
      timestamp: '1h ago',
      unread: false,
    },
  ]);

  return (
    <View style={styles.messagesContainer}>
      <View style={styles.messagesHeader}>
        <Text style={styles.messagesTitle}>Messages</Text>
      </View>

      <ScrollView style={styles.conversationsList}>
        {conversations.map((conversation) => (
          <TouchableOpacity
            key={conversation.id}
            style={styles.conversationCard}
            onPress={() => navigation.navigate('Conversation', { conversationId: conversation.id })}
          >
            <View style={styles.conversationAvatar}>
              <Text style={styles.conversationAvatarText}>🏪</Text>
            </View>
            <View style={styles.conversationInfo}>
              <View style={styles.conversationHeader}>
                <Text style={styles.conversationName}>{conversation.name}</Text>
                <Text style={styles.conversationTime}>{conversation.timestamp}</Text>
              </View>
              <Text
                style={[
                  styles.conversationMessage,
                  conversation.unread && styles.conversationMessageUnread,
                ]}
                numberOfLines={1}
              >
                {conversation.lastMessage}
              </Text>
            </View>
            {conversation.unread && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function ConversationScreen({ route }) {
  const navigation = useNavigation();
  const { conversationId } = route.params;
  const [message, setMessage] = React.useState('');
  const [messages, setMessages] = React.useState([
    { id: 1, text: 'Your order is ready for pickup!', sender: 'restaurant', timestamp: '2:00 PM' },
    { id: 2, text: 'Great! I\'ll be there in 10 minutes.', sender: 'user', timestamp: '2:01 PM' },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages([
      ...messages,
      {
        id: messages.length + 1,
        text: message,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setMessage('');
  };

  return (
    <View style={styles.conversationContainer}>
      <View style={styles.conversationHeaderView}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.conversationHeaderTitle}>Campus Cafe</Text>
      </View>

      <ScrollView style={styles.messagesList}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.sender === 'user' ? styles.messageBubbleUser : styles.messageBubbleOther,
            ]}
          >
            <Text style={styles.messageText}>{msg.text}</Text>
            <Text style={styles.messageTime}>{msg.timestamp}</Text>
        </View>
        ))}
      </ScrollView>

      <View style={styles.messageInputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
      </TouchableOpacity>
            </View>
            </View>
  );
}

function ProfileScreen() {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();

  const [activeTab, setActiveTab] = React.useState('orders');

  const currentOrders = [
    { id: 1, restaurant: 'Campus Cafe', item: 'Veggie Wrap', status: 'Ready for Pickup', time: '2:00 PM' },
    { id: 2, restaurant: 'Pizza Palace', item: 'Large Pizza', status: 'Preparing', time: '1:30 PM' },
  ];

  const pastOrders = [
    { id: 3, restaurant: 'Green Bowl', item: 'Acai Bowl', date: 'Jan 15, 2024', total: 5.59 },
    { id: 4, restaurant: 'Campus Cafe', item: 'Chicken Salad', date: 'Jan 14, 2024', total: 6.99 },
  ];

  const favoriteRestaurants = [
    { id: 1, name: 'Campus Cafe', category: 'Cafe' },
    { id: 2, name: 'Pizza Palace', category: 'Italian' },
  ];

  const stats = {
    moneySaved: 156.50,
    mealsRescued: 24,
    sustainabilityBadges: 3,
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.profileContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>👤</Text>
      </View>
        <Text style={styles.profileName}>{user?.name || 'User'}</Text>
        <Text style={styles.profileEmail}>{user?.email || ''}</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${stats.moneySaved.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Money Saved</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.mealsRescued}</Text>
          <Text style={styles.statLabel}>Meals Rescued</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.sustainabilityBadges}</Text>
          <Text style={styles.statLabel}>Badges</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {['orders', 'favorites', 'settings'].map((tab) => (
            <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            </TouchableOpacity>
          ))}
      </View>

      {activeTab === 'orders' && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Current Orders</Text>
          {currentOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderRestaurant}>{order.restaurant}</Text>
                <Text style={styles.orderItem}>{order.item}</Text>
                <Text style={styles.orderStatus}>{order.status}</Text>
        </View>
              <Text style={styles.orderTime}>{order.time}</Text>
              </View>
          ))}

          <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>Past Orders</Text>
          {pastOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderRestaurant}>{order.restaurant}</Text>
                <Text style={styles.orderItem}>{order.item}</Text>
                <Text style={styles.orderDate}>{order.date}</Text>
              </View>
              <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      {activeTab === 'favorites' && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Favorite Restaurants</Text>
          {favoriteRestaurants.map((restaurant) => (
              <TouchableOpacity
              key={restaurant.id}
              style={styles.favoriteCard}
              onPress={() => navigation.navigate('ListingDetail', { listingId: restaurant.id })}
            >
              <View style={styles.favoriteAvatar}>
                <Text style={styles.favoriteAvatarText}>🍽️</Text>
            </View>
              <View style={styles.favoriteInfo}>
                <Text style={styles.favoriteName}>{restaurant.name}</Text>
                <Text style={styles.favoriteCategory}>{restaurant.category}</Text>
          </View>
            </TouchableOpacity>
        ))}
      </View>
      )}

      {activeTab === 'settings' && (
        <View style={styles.tabContent}>
          <TouchableOpacity style={styles.settingsItem}>
            <Text style={styles.settingsItemText}>⚙️ Account Settings</Text>
            <Text style={styles.settingsArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsItem}>
            <Text style={styles.settingsItemText}>🔔 Notifications</Text>
            <Text style={styles.settingsArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsItem}>
            <Text style={styles.settingsItemText}>💳 Payment Methods</Text>
            <Text style={styles.settingsArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsItem} onPress={handleSignOut}>
            <Text style={[styles.settingsItemText, styles.signOutText]}>🚪 Sign Out</Text>
            <Text style={styles.settingsArrow}>→</Text>
          </TouchableOpacity>
      </View>
      )}
    </ScrollView>
  );
}

// ============================================================================
// NAVIGATION SETUP
// ============================================================================

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function HomeNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2e7d32',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{
          tabBarLabel: 'Browse',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24 }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateListingScreen}
        options={{
          tabBarLabel: 'Create',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24 }}>➕</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24 }}>💬</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24 }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AppTabs" component={AppTabs} />
      <Stack.Screen name="Conversation" component={ConversationScreen} />
      </Stack.Navigator>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5fff5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },

  // Auth Screens
  authContainer: {
    flex: 1,
    backgroundColor: '#f5fff5',
  },
  authContent: {
    padding: 20,
    paddingTop: 60,
  },
  authHeader: {
    marginBottom: 40,
    alignItems: 'center',
  },
  authTitle: {
    fontSize: 32,
    fontWeight: '800', 
    color: '#2e7d32', 
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  authForm: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff', 
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2e7d32',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: '700',
  },
  linkButton: {
    alignItems: 'center',
    padding: 12,
  },
  linkText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '600',
  },
  authDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 14,
  },
  toggleButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  toggleButtonActive: {
    borderColor: '#2e7d32',
    backgroundColor: '#e8f5e9',
  },
  toggleButtonText: {
    fontSize: 16,
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  imageUploadButton: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2e7d32',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  imageUploadText: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 16,
  },

  // Home Screen
  homeContainer: {
    flex: 1,
    backgroundColor: '#f5fff5',
  },
  homeHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  homeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2e7d32',
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 2,
  },
  viewModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewModeButtonActive: {
    backgroundColor: '#2e7d32',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  viewModeTextActive: {
    color: '#fff',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#333',
  },
  searchIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  filterContainer: {
    maxHeight: 50,
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listingsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  listingImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listingImagePlaceholder: {
    fontSize: 40,
  },
  listingInfo: {
    flex: 1,
  },
  listingName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 4,
  },
  listingRestaurant: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  listingTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  listingTag: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  listingTagText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '500',
  },
  listingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  listingPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listingOldPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  listingNewPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32',
  },
  listingTime: {
    fontSize: 12,
    color: '#d4af37',
    fontWeight: '600',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    margin: 16,
    borderRadius: 12,
  },
  mapPlaceholderText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 8,
  },
  mapPlaceholderHint: {
    fontSize: 14,
    color: '#666',
  },

  // Listing Detail
  detailContainer: {
    flex: 1,
    backgroundColor: '#f5fff5',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
  },
  detailImage: {
    height: 250,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailImagePlaceholder: {
    fontSize: 80,
  },
  detailContent: {
    padding: 20,
  },
  detailName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2e7d32',
    marginBottom: 4,
  },
  detailRestaurant: {
    fontSize: 18,
    color: '#666',
    marginBottom: 12,
  },
  detailDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  detailTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  detailTag: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  detailTagText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
  },
  detailPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailOldPrice: {
    fontSize: 20,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 12,
  },
  detailNewPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2e7d32',
  },
  detailInfo: {
    marginBottom: 24,
  },
  detailInfoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  restaurantInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  restaurantInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 12,
  },
  restaurantInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  reserveButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  reserveButtonDisabled: {
    backgroundColor: '#999',
  },
  reserveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },

  // Create Listing
  createContainer: {
    flex: 1,
    backgroundColor: '#f5fff5',
  },
  createHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  createTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2e7d32',
    marginBottom: 4,
  },
  createStep: {
    fontSize: 14,
    color: '#666',
  },
  createForm: {
    padding: 20,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputHalf: {
    width: '48%',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  tagChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tagChipActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  tagChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tagChipTextActive: {
    color: '#fff',
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  createActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },

  // Messages
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f5fff5',
  },
  messagesHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  messagesTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2e7d32',
  },
  conversationsList: {
    flex: 1,
    padding: 16,
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  conversationAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationAvatarText: {
    fontSize: 24,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
  },
  conversationTime: {
    fontSize: 12,
    color: '#999',
  },
  conversationMessage: {
    fontSize: 14,
    color: '#666',
  },
  conversationMessageUnread: {
    fontWeight: '600',
    color: '#333',
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2e7d32',
    marginLeft: 8,
  },
  conversationContainer: {
    flex: 1,
    backgroundColor: '#f5fff5',
  },
  conversationHeaderView: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  conversationHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2e7d32',
    marginLeft: 12,
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  messageBubbleUser: {
    backgroundColor: '#2e7d32',
    alignSelf: 'flex-end',
  },
  messageBubbleOther: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
  },
  messageInputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Profile
  profileContainer: {
    flex: 1,
    backgroundColor: '#f5fff5',
  },
  profileHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileAvatarText: {
    fontSize: 40,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2e7d32',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2e7d32',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#2e7d32',
  },
  tabContent: {
    padding: 16,
  },
  sectionTitleMargin: {
    marginTop: 24,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  orderInfo: {
    flex: 1,
  },
  orderRestaurant: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 4,
  },
  orderItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderStatus: {
    fontSize: 12,
    color: '#d4af37',
    fontWeight: '600',
  },
  orderTime: {
    fontSize: 14,
    color: '#666',
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32',
  },
  favoriteCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  favoriteAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  favoriteAvatarText: {
    fontSize: 24,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 4,
  },
  favoriteCategory: {
    fontSize: 14,
    color: '#666',
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  settingsItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  signOutText: {
    color: '#d32f2f',
  },
  settingsArrow: {
    fontSize: 20,
    color: '#999',
  },
});
