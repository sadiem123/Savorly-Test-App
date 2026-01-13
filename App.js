import * as React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Easing, ScrollView, TextInput, Alert, ActivityIndicator, Image } from 'react-native'; 
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { db, auth } from './src/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, getDoc, deleteDoc, updateDoc, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
console.log('🔥 Firestore instance:', db);
console.log('🔐 Firebase Auth:', auth);


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

  // Monitor auth state changes from Firebase
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        try {
          // Get user data from Firestore
          const userDocRef = doc(collection(db, 'users'), firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              ...userDocSnap.data(),
            });
          } else {
            // User exists in auth but not in Firestore yet
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'student',
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'student',
          });
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Sign in successful:', userCredential.user.email);
      return { success: true };
    } catch (error) {
      console.error('❌ Sign in error:', error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, userData) => {
    try {
      setLoading(true);
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Determine if this is a vendor or student sign-up
      const role = userData.role || 'student';

      // Save user data to Firestore
      const userDocRef = doc(collection(db, 'users'), newUser.uid);
      
      if (role === 'vendor') {
        // Vendor-specific fields
        await setDoc(userDocRef, {
          email: newUser.email,
          ...userData,
          role: 'vendor',
          createdAt: new Date().toISOString(),
          vendorStatus: 'active',
          // Vendor-specific metrics
          metrics: {
            total_revenue: 0,
            meals_shared: 0,
            orders_completed: 0,
          },
        });

        // Create vendor document in vendors collection
        const vendorDocRef = doc(collection(db, 'vendors'), newUser.uid);
        await setDoc(vendorDocRef, {
          userId: newUser.uid,
          name: userData.restaurantName || '',
          email: newUser.email,
          category: userData.category || 'Restaurant',
          address: userData.address || '',
          phone: userData.phone || '',
          hours: userData.hours || { open: '9:00 AM', close: '9:00 PM' },
          description: userData.description || '',
          ratings: {
            average: 5.0,
            count: 0,
          },
          createdAt: new Date().toISOString(),
          isActive: true,
        });
      } else {
        // Student-specific fields
        await setDoc(userDocRef, {
          email: newUser.email,
          ...userData,
          role: 'student',
          createdAt: new Date().toISOString(),
          metrics: {
            money_saved: 0,
            meals_rescued: 0,
          },
        });
      }

      console.log('✅ Sign up successful:', newUser.email, `(${role})`);
      return { success: true };
    } catch (error) {
      console.error('❌ Sign up error:', error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await firebaseSignOut(auth);
      setUser(null);
      console.log('✅ Sign out successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out error:', error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// METRICS UTILITY FUNCTIONS
// ============================================================================

export const updateUserMetrics = async (userId, amountSpent, servings) => {
  try {
    const userDocRef = doc(collection(db, 'users'), userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      const currentMetrics = userDocSnap.data().metrics || { money_saved: 0, meals_rescued: 0 };
      
      await setDoc(userDocRef, {
        ...userDocSnap.data(),
        metrics: {
          money_saved: (currentMetrics.money_saved || 0) + amountSpent,
          meals_rescued: (currentMetrics.meals_rescued || 0) + servings,
        },
      }, { merge: true });
      
      console.log('✅ Metrics updated:', { amountSpent, servings });
      return { success: true };
    } else {
      console.error('❌ User document not found');
      return { success: false, error: 'User document not found' };
    }
  } catch (error) {
    console.error('❌ Error updating metrics:', error.message);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// VENDOR UTILITY FUNCTIONS
// ============================================================================

export const createMenuItem = async (vendorId, menuItem) => {
  try {
    const { query: _, ...itemData } = menuItem; // Remove any temp query field
    const itemsCollection = collection(db, 'vendors', vendorId, 'menuItems');
    const itemDocRef = doc(itemsCollection);
    
    await setDoc(itemDocRef, {
      ...itemData,
      createdAt: new Date().toISOString(),
      isAvailable: true,
    });
    
    console.log('✅ Menu item created:', menuItem.name);
    return { success: true, id: itemDocRef.id };
  } catch (error) {
    console.error('❌ Error creating menu item:', error.message);
    return { success: false, error: error.message };
  }
};

export const updateMenuItem = async (vendorId, menuItemId, updates) => {
  try {
    const itemDocRef = doc(collection(db, 'vendors', vendorId, 'menuItems'), menuItemId);
    await setDoc(itemDocRef, { ...updates }, { merge: true });
    
    console.log('✅ Menu item updated:', menuItemId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating menu item:', error.message);
    return { success: false, error: error.message };
  }
};

export const deleteMenuItem = async (vendorId, menuItemId) => {
  try {
    const itemDocRef = doc(collection(db, 'vendors', vendorId, 'menuItems'), menuItemId);
    await deleteDoc(itemDocRef);
    
    console.log('✅ Menu item deleted:', menuItemId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting menu item:', error.message);
    return { success: false, error: error.message };
  }
};

export const updateVendorMetrics = async (vendorId, revenue, mealsShared, ordersCompleted = 0) => {
  try {
    const vendorDocRef = doc(collection(db, 'vendors'), vendorId);
    const vendorDocSnap = await getDoc(vendorDocRef);
    
    if (vendorDocSnap.exists()) {
      const currentMetrics = vendorDocSnap.data().metrics || { total_revenue: 0, meals_shared: 0, orders_completed: 0 };
      
      await setDoc(vendorDocRef, {
        metrics: {
          total_revenue: (currentMetrics.total_revenue || 0) + revenue,
          meals_shared: (currentMetrics.meals_shared || 0) + mealsShared,
          orders_completed: (currentMetrics.orders_completed || 0) + ordersCompleted,
        },
      }, { merge: true });
      
      console.log('✅ Vendor metrics updated');
      return { success: true };
    } else {
      console.error('❌ Vendor document not found');
      return { success: false, error: 'Vendor document not found' };
    }
  } catch (error) {
    console.error('❌ Error updating vendor metrics:', error.message);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// FAVORITES CONTEXT
// ============================================================================

const FavoritesContext = React.createContext();

export const useFavorites = () => {
  const context = React.useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favoriteVendors, setFavoriteVendorsState] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { user } = useAuth();

  // Load favorites from AsyncStorage on mount and when user changes
  React.useEffect(() => {
    const loadFavorites = async () => {
      try {
        if (user) {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const stored = await AsyncStorage.getItem(`favorites_${user.id}`);
          if (stored) {
            setFavoriteVendorsState(JSON.parse(stored));
          }
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadFavorites();
  }, [user]);

  const setFavoriteVendors = async (vendors) => {
    try {
      setFavoriteVendorsState(vendors);
      if (user) {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(`favorites_${user.id}`, JSON.stringify(vendors));
      }
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const addFavorite = async (vendorName) => {
    const updated = [...favoriteVendors, vendorName];
    await setFavoriteVendors(updated);
  };

  const removeFavorite = async (vendorName) => {
    const updated = favoriteVendors.filter(v => v !== vendorName);
    await setFavoriteVendors(updated);
  };

  const toggleFavorite = async (vendorName) => {
    if (favoriteVendors.includes(vendorName)) {
      await removeFavorite(vendorName);
    } else {
      await addFavorite(vendorName);
    }
  };

  return (
    <FavoritesContext.Provider value={{ favoriteVendors, setFavoriteVendors, addFavorite, removeFavorite, toggleFavorite, isLoading }}>
      {children}
    </FavoritesContext.Provider>
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
  const [emailError, setEmailError] = React.useState('');

  const handleSignIn = async () => {
    setEmailError(''); // Clear any previous error

    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (!email.endsWith('@berkeley.edu')) {
      setEmailError('User must log in with a valid Berkeley email');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn(email, password);
      if (!result.success) {
        Alert.alert('Sign In Failed', result.error || 'Invalid credentials');
      }
      // Navigation handled by AuthProvider state change
    } catch (error) {
      Alert.alert('Sign In Failed', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCalNetSignIn = () => {
    // TODO: Implement CalNet SSO
    Alert.alert('CalNet SSO', 'CalNet authentication will be implemented');
  };

  return (
    <View style={styles.authContainer}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.authContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="automatic"
        alwaysBounceVertical={true}
        bounces={true}
      >
        <View style={styles.authHeader}>
          <Text style={styles.authTitle}>Welcome to Savorly!</Text>
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
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError(''); // Clear error on typing
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {emailError ? <Text style={styles.errorText}>⚠️ {emailError}</Text> : null}
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
          <Text style={styles.secondaryButtonText}>Restaurant Login</Text>
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
    </View>
  );
}

function SignUpScreen() {
  const navigation = useNavigation();
  const { signUp } = useAuth();
  
  const [userRole, setUserRole] = React.useState('student'); // 'student' or 'vendor'
  const [step, setStep] = React.useState(1);
  
  // Shared fields
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [emailError, setEmailError] = React.useState('');
  
  // Vendor-specific fields
  const [restaurantName, setRestaurantName] = React.useState('');
  const [category, setCategory] = React.useState('Restaurant');
  const [address, setAddress] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [openHours, setOpenHours] = React.useState('09:00');
  const [closeHours, setCloseHours] = React.useState('21:00');
  const [description, setDescription] = React.useState('');

  const handleNext = () => {
    if (step === 1) {
      // Step 1: Role selection
      setStep(2);
    } else if (step === 2) {
      // Step 2: Basic info validation
      if (userRole === 'student') {
        if (!firstName || !lastName || !displayName || !email || !password || !confirmPassword) {
          Alert.alert('Error', 'Please fill in all fields');
          return;
        }
      } else {
        if (!restaurantName || !email || !password || !confirmPassword || !phone || !address) {
          Alert.alert('Error', 'Please fill in all required fields');
          return;
        }
      }
      
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      
      handleSignUp();
    }
  };

  const handleSignUp = async () => {
    setEmailError('');

    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (!email.endsWith('@berkeley.edu')) {
      setEmailError('Must use a valid Berkeley email (@berkeley.edu)');
      return;
    }

    setLoading(true);
    try {
      let userData = {
        role: userRole,
      };

      if (userRole === 'student') {
        userData = {
          ...userData,
          firstName: firstName || '',
          lastName: lastName || '',
          name: displayName || '',
          displayName: displayName || '',
        };
      } else {
        userData = {
          ...userData,
          restaurantName: restaurantName || '',
          category: category || 'Restaurant',
          address: address || '',
          phone: phone || '',
          hours: {
            open: openHours || '09:00',
            close: closeHours || '21:00',
          },
          description: description || '',
        };
      }

      const result = await signUp(email, password, userData);
      if (!result.success) {
        Alert.alert('Sign Up Failed', result.error || 'An error occurred');
      }
    } catch (error) {
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.authContainer}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.authContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        <View style={styles.createHeader}>
          <Text style={styles.authTitle}>Create Account</Text>
        </View>

        {/* STEP 1: ROLE SELECTION */}
        {step === 1 && (
          <View style={styles.authForm}>
            <Text style={styles.sectionTitle}>I am a...</Text>
            
            <TouchableOpacity
              style={[
                styles.roleCard,
                userRole === 'student' && styles.roleCardSelected,
              ]}
              onPress={() => setUserRole('student')}
            >
              <Text style={styles.roleCardEmoji}>🎓</Text>
              <Text style={[styles.roleCardTitle, userRole === 'student' && { color: '#2e7d32' }]}>
                Student
              </Text>
              <Text style={styles.roleCardSubtitle}>Browse & purchase meals</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleCard,
                userRole === 'vendor' && styles.roleCardSelected,
              ]}
              onPress={() => setUserRole('vendor')}
            >
              <Text style={styles.roleCardEmoji}>🍽️</Text>
              <Text style={[styles.roleCardTitle, userRole === 'vendor' && { color: '#2e7d32' }]}>
                Vendor
              </Text>
              <Text style={styles.roleCardSubtitle}>List & sell surplus meals</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('SignIn')}
            >
              <Text style={styles.linkText}>Already have an account? Sign In</Text>
            </TouchableOpacity>

            <View style={styles.scrollSpacer} />
          </View>
        )}

        {/* STEP 2: STUDENT SIGN UP */}
        {step === 2 && userRole === 'student' && (
          <View style={styles.authForm}>
            <View style={[styles.inputContainer, styles.firstInput]}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your last name"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.input}
                placeholder="How others will see you (e.g. Oski1868)"
                placeholderTextColor="#999"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Berkeley Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your.email@berkeley.edu"
                placeholderTextColor="#999"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {emailError ? <Text style={styles.errorText}>⚠️ {emailError}</Text> : null}
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

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setStep(1)}
            >
              <Text style={styles.linkText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.scrollSpacer} />
          </View>
        )}

        {/* STEP 2: VENDOR SIGN UP */}
        {step === 2 && userRole === 'vendor' && (
          <View style={styles.authForm}>
            <View style={[styles.inputContainer, styles.firstInput]}>
              <Text style={styles.inputLabel}>Restaurant Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Your restaurant name"
                placeholderTextColor="#999"
                value={restaurantName}
                onChangeText={setRestaurantName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.selectContainer}>
                <Text style={styles.selectText}>{category}</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="Restaurant address"
                placeholderTextColor="#999"
                value={address}
                onChangeText={setAddress}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="(555) 123-4567"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Berkeley Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="your.email@berkeley.edu"
                placeholderTextColor="#999"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {emailError ? <Text style={styles.errorText}>⚠️ {emailError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter a strong password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Tell students about your restaurant"
                placeholderTextColor="#999"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Vendor Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setStep(1)}
            >
              <Text style={styles.linkText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.scrollSpacer} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// MAIN APP SCREENS
// ============================================================================

function HomeScreen() {
  const navigation = useNavigation();
  const { favoriteVendors, toggleFavorite } = useFavorites();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFilters, setSelectedFilters] = React.useState([]);
  const [showVendorView, setShowVendorView] = React.useState(false);
  const [selectedVendor, setSelectedVendor] = React.useState(null);

  // MEALS listings
  const mealsListings = [
    {
      id: 1,
      type: 'meal',
      restaurant: 'Campus Cafe',
      name: 'Veggie Wrap',
      price: 8.99,
      discountPrice: 6.29,
      category: 'Sandwiches',
      dietaryTags: ['Vegetarian', 'Gluten Free'],
      serves: 1,
      availableTime: '1:00 PM - 2:00 PM',
      imageUrl: null,
    },
    {
      id: 2,
      type: 'meal',
      restaurant: 'Pizza Palace',
      name: 'Large Pizza',
      price: 18.99,
      discountPrice: 9.50,
      category: 'Italian',
      dietaryTags: ['Vegetarian'],
      serves: 4,
      availableTime: '12:00 PM - 1:00 PM',
      imageUrl: null,
    },
    {
      id: 3,
      type: 'meal',
      restaurant: 'Green Bowl',
      name: 'Acai Bowl',
      price: 7.99,
      discountPrice: 5.59,
      category: 'Healthy',
      dietaryTags: ['Vegan', 'Gluten Free'],
      serves: 1,
      availableTime: '2:00 PM - 3:00 PM',
      imageUrl: null,
    },
  ];

  // MARKET listings
  const marketListings = [
    {
      id: 101,
      type: 'market',
      restaurant: 'Campus Market',
      name: 'Bag of Apples',
      price: 6.99,
      discountPrice: 3.99,
      category: 'Produce',
      dietaryTags: ['Vegan', 'Gluten Free'],
      serves: 4,
      availableTime: '5:00 PM - 6:00 PM',
      imageUrl: null,
    },
    {
      id: 102,
      type: 'market',
      restaurant: 'Campus Market',
      name: 'Whole Wheat Bread',
      price: 5.49,
      discountPrice: 2.99,
      category: 'Bakery',
      dietaryTags: ['Vegetarian'],
      serves: 2,
      availableTime: '6:00 PM - 7:00 PM',
      imageUrl: null,
    },
  ];

  const filters = ['Meals', 'Market', 'Vegetarian', 'Gluten Free', 'Vegan', 'Serves 4+'];

  const toggleFilter = (filter) => {
    if (selectedFilters.includes(filter)) {
      setSelectedFilters(selectedFilters.filter(f => f !== filter));
    } else {
      setSelectedFilters([...selectedFilters, filter]);
    }
  };

  // Get unique vendors and their listings
  const allListings = [...mealsListings, ...marketListings];
  const vendors = [...new Set(allListings.map(item => item.restaurant))].map(vendorName => ({
    name: vendorName,
    listings: allListings.filter(item => item.restaurant === vendorName),
  }));

  const filteredListings = allListings.filter(listing => {
    const matchesSearch =
      listing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.restaurant.toLowerCase().includes(searchQuery.toLowerCase());

    // Check type filters (Meals/Market)
    const hasMealsFilter = selectedFilters.includes('Meals');
    const hasMarketFilter = selectedFilters.includes('Market');
    const matchesType =
      (!hasMealsFilter && !hasMarketFilter) || // No type filters selected = show all
      (hasMealsFilter && listing.type === 'meal') ||
      (hasMarketFilter && listing.type === 'market');

    // Check dietary filters
    const dietaryFilters = selectedFilters.filter(f =>
      ['Vegetarian', 'Gluten Free', 'Vegan'].includes(f)
    );
    const matchesDietary =
      dietaryFilters.length === 0 ||
      dietaryFilters.some(filter => listing.dietaryTags.includes(filter));

    // Check serves filter
    const matchesServes =
      !selectedFilters.includes('Serves 4+') || listing.serves >= 4;

    return matchesSearch && matchesType && matchesDietary && matchesServes;
  });

  if (showVendorView) {
    return (
      <View style={styles.homeContainer}>
        <View style={styles.homeHeader}>
          <Text style={styles.homeTitle}>Browse Food</Text>
          <View style={styles.browseToggle}>
            <TouchableOpacity
              style={[
                styles.browseToggleButton,
                !showVendorView && styles.browseToggleButtonActive,
              ]}
              onPress={() => setShowVendorView(false)}
            >
              <Text
                style={[
                  styles.browseToggleText,
                  !showVendorView && styles.browseToggleTextActive,
                ]}
              >
                Listings
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.browseToggleButton,
                showVendorView && styles.browseToggleButtonActive,
              ]}
              onPress={() => setShowVendorView(true)}
            >
              <Text
                style={[
                  styles.browseToggleText,
                  showVendorView && styles.browseToggleTextActive,
                ]}
              >
                Vendors
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.vendorsList} showsVerticalScrollIndicator={false}>
          {vendors.map((vendor) => (
            <View key={vendor.name} style={{ position: 'relative' }}>
              <TouchableOpacity
                style={styles.listingCard}
                onPress={() => setSelectedVendor(vendor)}
              >
                <View style={styles.listingImage}>
                  <Text style={styles.listingImagePlaceholder}>🏪</Text>
                </View>

                <View style={styles.listingInfo}>
                  <Text style={styles.listingName}>{vendor.name}</Text>
                  <Text style={styles.listingRestaurant}>
                    {vendor.listings.length} item{vendor.listings.length !== 1 ? 's' : ''}
                  </Text>

                  <View style={styles.listingTags}>
                    {/* Show unique dietary tags across all vendor items */}
                    {[...new Set(vendor.listings.flatMap(item => item.dietaryTags))].slice(0, 2).map((tag, idx) => (
                      <View key={idx} style={styles.listingTag}>
                        <Text style={styles.listingTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.listingFooter}>
                    <View style={styles.listingPrice}>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.vendorHeartButton}
                onPress={() => toggleFavorite(vendor.name)}
              >
                <Text style={[styles.vendorHeartIcon, favoriteVendors.includes(vendor.name) ? {} : styles.vendorHeartIconOutline]}>
                  {favoriteVendors.includes(vendor.name) ? '⭐' : '☆'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {selectedVendor && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedVendor.name}</Text>
                <TouchableOpacity onPress={() => setSelectedVendor(null)}>
                  <Text style={styles.modalCloseButton}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalListings} showsVerticalScrollIndicator={false}>
                {selectedVendor.listings.map((listing) => (
                  <TouchableOpacity
                    key={listing.id}
                    style={styles.listingCard}
                    onPress={() => {
                      setSelectedVendor(null);
                      navigation.navigate('ListingDetail', { listingId: listing.id });
                    }}
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
                          <Text style={styles.listingNewPrice}>
                            ${listing.discountPrice.toFixed(2)}
                          </Text>
                        </View>
                        <Text style={styles.listingTime}>
                          ⏰ Pickup from {listing.availableTime}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.homeContainer}>
      <View style={styles.homeHeader}>
        <Text style={styles.homeTitle}>Browse Food</Text>
        <View style={styles.browseToggle}>
          <TouchableOpacity
            style={[
              styles.browseToggleButton,
              !showVendorView && styles.browseToggleButtonActive,
            ]}
            onPress={() => setShowVendorView(false)}
          >
            <Text
              style={[
                styles.browseToggleText,
                !showVendorView && styles.browseToggleTextActive,
              ]}
            >
              Listings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.browseToggleButton,
              showVendorView && styles.browseToggleButtonActive,
            ]}
            onPress={() => setShowVendorView(true)}
          >
            <Text
              style={[
                styles.browseToggleText,
                showVendorView && styles.browseToggleTextActive,
              ]}
            >
              Vendors
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants or items..."
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

      <ScrollView style={styles.listingsContainer} showsVerticalScrollIndicator={false}>
        {filteredListings.map((listing) => (
          <TouchableOpacity
            key={listing.id}
            style={styles.listingCard}
            onPress={() =>
              navigation.navigate('ListingDetail', { listingId: listing.id })
            }
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
                  <Text style={styles.listingNewPrice}>
                    ${listing.discountPrice.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.listingTime}>
                  ⏰ Pickup from {listing.availableTime}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function ListingDetailScreen({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { listingId } = route.params;
  const [isReserved, setIsReserved] = React.useState(false);

  // Get listing data from the combined listings
  const mealsListings = [
    {
      id: 1,
      type: 'meal',
      restaurant: 'Campus Cafe',
      name: 'Veggie Wrap',
      description: 'Fresh vegetables wrapped in a whole wheat tortilla with hummus and greens.',
      price: 8.99,
      discountPrice: 6.29,
      category: 'Sandwiches',
      dietaryTags: ['Vegetarian', 'Gluten Free'],
      serves: 1,
      availableTime: '1:00 PM - 2:00 PM',
      restaurantHours: 'Mon-Fri: 8am-8pm',
      restaurantAddress: '123 University Ave, Berkeley',
      restaurantPhone: '(555) 123-4567',
    },
    {
      id: 2,
      type: 'meal',
      restaurant: 'Pizza Palace',
      name: 'Large Pizza',
      description: 'Large cheese pizza with fresh toppings.',
      price: 18.99,
      discountPrice: 9.50,
      category: 'Italian',
      dietaryTags: ['Vegetarian'],
      serves: 4,
      availableTime: '12:00 PM - 1:00 PM',
      restaurantHours: 'Mon-Fri: 11am-10pm',
      restaurantAddress: '456 College Ave, Berkeley',
      restaurantPhone: '(555) 234-5678',
    },
    {
      id: 3,
      type: 'meal',
      restaurant: 'Green Bowl',
      name: 'Acai Bowl',
      description: 'Refreshing acai bowl with fresh fruits and granola.',
      price: 7.99,
      discountPrice: 5.59,
      category: 'Healthy',
      dietaryTags: ['Vegan', 'Gluten Free'],
      serves: 1,
      availableTime: '2:00 PM - 3:00 PM',
      restaurantHours: 'Mon-Fri: 7am-7pm',
      restaurantAddress: '789 Student Center, Berkeley',
      restaurantPhone: '(555) 345-6789',
    },
  ];

  const marketListings = [
    {
      id: 101,
      type: 'market',
      restaurant: 'Campus Market',
      name: 'Bag of Apples',
      description: 'Fresh organic apples, perfect for snacking.',
      price: 6.99,
      discountPrice: 3.99,
      category: 'Produce',
      dietaryTags: ['Vegan', 'Gluten Free'],
      serves: 4,
      availableTime: '5:00 PM - 6:00 PM',
      restaurantHours: 'Mon-Fri: 9am-9pm',
      restaurantAddress: '321 Market St, Berkeley',
      restaurantPhone: '(555) 456-7890',
    },
    {
      id: 102,
      type: 'market',
      restaurant: 'Campus Market',
      name: 'Whole Wheat Bread',
      description: 'Freshly baked whole wheat bread loaf.',
      price: 5.49,
      discountPrice: 2.99,
      category: 'Bakery',
      dietaryTags: ['Vegetarian'],
      serves: 2,
      availableTime: '6:00 PM - 7:00 PM',
      restaurantHours: 'Mon-Fri: 9am-9pm',
      restaurantAddress: '321 Market St, Berkeley',
      restaurantPhone: '(555) 456-7890',
    },
  ];

  const allListings = [...mealsListings, ...marketListings];
  const listing = allListings.find(l => l.id === listingId) || {
    id: listingId,
    restaurant: 'Campus Cafe',
    name: 'Veggie Wrap',
    description: 'Fresh vegetables wrapped in a whole wheat tortilla with hummus and greens.',
    price: 8.99,
    discountPrice: 6.29,
    category: 'Sandwiches',
    dietaryTags: ['Vegetarian', 'Gluten Free'],
    serves: 1,
    availableTime: '1:00 PM - 2:00 PM',
    restaurantHours: 'Mon-Fri: 8am-8pm',
    restaurantAddress: '123 University Ave, Berkeley',
    restaurantPhone: '(555) 123-4567',
  };

  // Extract the end time from the availableTime range
  const getEndTime = (timeRange) => {
    const parts = timeRange.split(' - ');
    return parts[1] || timeRange; // Return the second part (end time) or the whole string if no dash
  };

  const availableUntil = getEndTime(listing.availableTime);

  const handleReserve = () => {
    Alert.alert(
      'Reserve Item',
      `Reserve ${listing.name} from ${listing.restaurant}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reserve',
          onPress: async () => {
            setIsReserved(true);
            
            // Update user metrics and create order
            if (user && user.id) {
              await updateUserMetrics(
                user.id,
                listing.discountPrice,
                listing.serves
              );

              // Create order document in Firestore
              try {
                const ordersCollection = collection(db, 'orders');
                const orderData = {
                  studentId: user.id,
                  studentName: user.displayName || user.name || 'Student',
                  studentEmail: user.email,
                  vendorId: listing.vendorId, // Assuming listing has vendorId
                  vendorName: listing.restaurant,
                  itemName: listing.name,
                  itemPrice: listing.discountPrice,
                  servings: listing.serves,
                  orderStatus: 'pending', // pending, ready, completed, cancelled
                  createdAt: new Date().toISOString(),
                  pickupTime: null,
                  notes: '',
                };

                const ordersRef = collection(db, 'orders');
                await setDoc(doc(ordersRef), orderData);

                // Also update vendor metrics
                if (listing.vendorId) {
                  await updateVendorMetrics(
                    listing.vendorId,
                    listing.discountPrice,
                    listing.serves,
                    1 // increment orders_completed
                  );
                }

                console.log('✅ Order created successfully');
              } catch (error) {
                console.error('Error creating order:', error);
              }
            }
            
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
          <Text style={styles.detailNewPrice}>${listing.discountPrice.toFixed(2)}</Text>
        </View>

        <View style={styles.detailInfo}>
          <Text style={styles.detailInfoText}>⏰ Pickup until {availableUntil}</Text>
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
          <View
            key={conversation.id}
            style={styles.conversationCard}
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
          </View>
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
  const { favoriteVendors, removeFavorite } = useFavorites();

  const [activeTab, setActiveTab] = React.useState('orders');
  const [stats, setStats] = React.useState({
    moneySaved: 0,
    mealsRescued: 0,
    mealsDonated: 47,
  });
  const [metricsLoading, setMetricsLoading] = React.useState(true);

  // Fetch metrics from Firestore
  React.useEffect(() => {
    const fetchMetrics = async () => {
      try {
        if (user && user.id) {
          const userDocRef = doc(collection(db, 'users'), user.id);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const metrics = userDocSnap.data().metrics || { money_saved: 0, meals_rescued: 0 };
            setStats({
              moneySaved: metrics.money_saved || 0,
              mealsRescued: metrics.meals_rescued || 0,
              mealsDonated: 47,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setMetricsLoading(false);
      }
    };
    
    fetchMetrics();
  }, [user]);

  const currentOrders = [
    { id: 1, restaurant: 'Campus Cafe', item: 'Veggie Wrap', status: 'Ready for Pickup', time: '2:00 PM' },
    { id: 2, restaurant: 'Pizza Palace', item: 'Large Pizza', status: 'Preparing', time: '1:30 PM' },
  ];

  const pastOrders = [
    { id: 3, restaurant: 'Green Bowl', item: 'Acai Bowl', date: 'Jan 15, 2024', total: 5.59 },
    { id: 4, restaurant: 'Campus Cafe', item: 'Chicken Salad', date: 'Jan 14, 2024', total: 6.99 },
  ];

  const allVendors = [
    { name: 'Campus Cafe', category: 'Cafe' },
    { name: 'Pizza Palace', category: 'Italian' },
    { name: 'Green Bowl', category: 'Healthy' },
    { name: 'Campus Market', category: 'Market' },
  ];

  const favoriteRestaurants = allVendors.filter(vendor => favoriteVendors.includes(vendor.name));

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
        <View style={styles.profileNameContainer}>
          <Text style={styles.profileFullName}>
            {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : (user?.displayName || user?.name || 'User')}
          </Text>
          {user?.displayName && (user?.firstName || user?.lastName) && (
            <Text style={styles.profileDisplayName}>{user.displayName}</Text>
          )}
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <View style={[styles.statCircle, styles.moneyCircle]}>
            <Text style={styles.statCircleValue}>${stats.moneySaved.toFixed(0)}</Text>
          </View>
          <Text style={styles.statCircleLabel}>Money Saved</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statCircle, styles.mealsCircle]}>
            <Text style={styles.statCircleValue}>{stats.mealsRescued}</Text>
          </View>
          <Text style={styles.statCircleLabel}>Meals Rescued</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statCircle, styles.donatedCircle]}>
            <Text style={styles.statCircleValue}>{stats.mealsDonated}</Text>
          </View>
          <Text style={styles.statCircleLabel}>Meals Donated</Text>
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
          {favoriteRestaurants.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No favorite restaurants yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Add restaurants to your favorites on the Browse Vendors page!
              </Text>
            </View>
          ) : (
            favoriteRestaurants.map((restaurant) => (
              <View key={restaurant.name} style={styles.favoriteCard}>
                <View style={styles.favoriteAvatar}>
                  <Text style={styles.favoriteAvatarText}>🏪</Text>
                </View>
                <View style={styles.favoriteInfo}>
                  <Text style={styles.favoriteName}>{restaurant.name}</Text>
                  <Text style={styles.favoriteCategory}>{restaurant.category}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeFavorite(restaurant.name)}
                >
                  <Text style={styles.favoriteRemoveButton}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}

      {activeTab === 'settings' && (
        <View style={styles.tabContent}>
          <TouchableOpacity style={styles.settingsItem}>
            <Text style={styles.settingsItemText}>⚙️ Account Settings</Text>
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

// ============================================================================
// VENDOR SCREENS
// ============================================================================

function VendorDashboardScreen() {
  const { user } = useAuth();
  const [vendorData, setVendorData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    totalRevenue: 0,
    mealsShared: 0,
    ordersCompleted: 0,
  });

  React.useEffect(() => {
    const fetchVendorData = async () => {
      try {
        if (!user?.id) return;
        
        const vendorDocRef = doc(collection(db, 'vendors'), user.id);
        const vendorDocSnap = await getDoc(vendorDocRef);
        
        if (vendorDocSnap.exists()) {
          const data = vendorDocSnap.data();
          setVendorData(data);
          
          if (data.metrics) {
            setStats({
              totalRevenue: data.metrics.total_revenue || 0,
              mealsShared: data.metrics.meals_shared || 0,
              ordersCompleted: data.metrics.orders_completed || 0,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching vendor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [user?.id]);

  return (
    <ScrollView style={styles.vendorContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.vendorHeader}>
        <Text style={styles.vendorTitle}>Dashboard</Text>
        <Text style={styles.vendorSubtitle}>Welcome back, {vendorData?.name || 'Restaurant'}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${stats.totalRevenue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.mealsShared}</Text>
          <Text style={styles.statLabel}>Meals Shared</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.ordersCompleted}</Text>
          <Text style={styles.statLabel}>Orders Completed</Text>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>➕ Add Menu Item</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>👀 View Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📝 Edit Restaurant Info</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function VendorMenuScreen() {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [newItem, setNewItem] = React.useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    serves: '',
  });

  React.useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        if (!user?.id) return;
        
        const itemsCollection = collection(db, 'vendors', user.id, 'menuItems');
        const itemsQuery = query(itemsCollection);
        const itemsSnap = await getDocs(itemsQuery);
        
        const items = [];
        itemsSnap.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() });
        });
        setMenuItems(items);
      } catch (error) {
        console.error('Error fetching menu items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [user?.id]);

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const result = await createMenuItem(user.id, {
        name: newItem.name,
        description: newItem.description,
        price: parseFloat(newItem.price),
        originalPrice: parseFloat(newItem.originalPrice) || parseFloat(newItem.price),
        serves: parseInt(newItem.serves) || 1,
      });

      if (result.success) {
        setNewItem({ name: '', description: '', price: '', originalPrice: '', serves: '' });
        setShowAddModal(false);
        Alert.alert('Success', 'Menu item added!');
        // Refresh menu items
        const itemsCollection = collection(db, 'vendors', user.id, 'menuItems');
        const itemsSnap = await getDocs(itemsCollection);
        const items = [];
        itemsSnap.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() });
        });
        setMenuItems(items);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add menu item');
    }
  };

  const handleDeleteItem = async (itemId) => {
    Alert.alert('Delete Item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMenuItem(user.id, itemId);
            setMenuItems(menuItems.filter(item => item.id !== itemId));
            Alert.alert('Success', 'Menu item deleted');
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.vendorContainer}>
      <View style={styles.vendorHeader}>
        <Text style={styles.vendorTitle}>Menu Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
        </View>
      ) : menuItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No menu items yet</Text>
          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 16 }]}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.primaryButtonText}>Add First Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {menuItems.map((item) => (
            <View key={item.id} style={styles.menuItemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuItemName}>{item.name}</Text>
                {item.description && (
                  <Text style={styles.menuItemDesc}>{item.description}</Text>
                )}
                <View style={styles.menuItemPricing}>
                  <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
                  {item.originalPrice > item.price && (
                    <Text style={styles.menuItemOriginal}>Was ${item.originalPrice.toFixed(2)}</Text>
                  )}
                  <Text style={styles.menuItemServes}>Serves {item.serves}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteItem(item.id)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {showAddModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Menu Item</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: '80%' }}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Item Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Grilled Chicken Pasta"
                  value={newItem.name}
                  onChangeText={(text) => setNewItem({ ...newItem, name: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, { height: 60 }]}
                  placeholder="Describe your dish"
                  value={newItem.description}
                  onChangeText={(text) => setNewItem({ ...newItem, description: text })}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Discount Price *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 5.99"
                  value={newItem.price}
                  onChangeText={(text) => setNewItem({ ...newItem, price: text })}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Original Price</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 12.99"
                  value={newItem.originalPrice}
                  onChangeText={(text) => setNewItem({ ...newItem, originalPrice: text })}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Serves (servings)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2"
                  value={newItem.serves}
                  onChangeText={(text) => setNewItem({ ...newItem, serves: text })}
                  keyboardType="number-pad"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAddItem}
            >
              <Text style={styles.primaryButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function VendorOrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchVendorOrders = async () => {
      try {
        if (!user?.id) return;
        
        const ordersCollection = collection(db, 'orders');
        const ordersQuery = query(
          ordersCollection,
          where('vendorId', '==', user.id),
          orderBy('createdAt', 'desc')
        );
        
        const ordersSnap = await getDocs(ordersQuery);
        const vendorOrders = [];
        
        ordersSnap.forEach(doc => {
          vendorOrders.push({ id: doc.id, ...doc.data() });
        });
        
        setOrders(vendorOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorOrders();
  }, [user?.id]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const orderRef = doc(collection(db, 'orders'), orderId);
      await updateDoc(orderRef, { orderStatus: newStatus });
      
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, orderStatus: newStatus } : order
      ));
      
      Alert.alert('Success', `Order status updated to ${newStatus}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#ff9800';
      case 'ready': return '#4caf50';
      case 'completed': return '#2196f3';
      case 'cancelled': return '#d32f2f';
      default: return '#999';
    }
  };

  return (
    <View style={styles.vendorContainer}>
      <View style={styles.vendorHeader}>
        <Text style={styles.vendorTitle}>Orders</Text>
        {orders.length > 0 && (
          <View style={{ backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
            <Text style={{ color: '#2e7d32', fontWeight: '700', fontSize: 14 }}>{orders.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No orders yet</Text>
          <Text style={{ fontSize: 13, color: '#999', marginTop: 8 }}>Orders will appear here</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 16 }}>
          {orders.map((order) => (
            <View key={order.id} style={styles.vendorOrderCard}>
              <View style={{ flex: 1, marginBottom: 12 }}>
                <Text style={styles.orderName}>{order.studentName}</Text>
                <Text style={styles.orderItem}>{order.itemName}</Text>
                <View style={{ flexDirection: 'row', marginTop: 8, gap: 16 }}>
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    💰 ${order.itemPrice.toFixed(2)}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    👥 {order.servings} servings
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  {new Date(order.createdAt).toLocaleString()}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: getStatusColor(order.orderStatus) }]}
                  onPress={() => {
                    const statuses = ['pending', 'ready', 'completed', 'cancelled'];
                    Alert.alert('Update Status', `Current: ${order.orderStatus}`, [
                      ...statuses.map(status => ({
                        text: status.charAt(0).toUpperCase() + status.slice(1),
                        onPress: () => handleStatusUpdate(order.id, status),
                      })),
                      { text: 'Cancel', style: 'cancel' },
                    ]);
                  }}
                >
                  <Text style={styles.statusButtonText}>
                    {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function VendorProfileScreen() {
  const { user, signOut } = useAuth();
  const [vendorData, setVendorData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchVendorData = async () => {
      try {
        if (!user?.id) return;
        const vendorDocRef = doc(collection(db, 'vendors'), user.id);
        const vendorDocSnap = await getDoc(vendorDocRef);
        if (vendorDocSnap.exists()) {
          setVendorData(vendorDocSnap.data());
        }
      } catch (error) {
        console.error('Error fetching vendor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [user?.id]);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
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
    <ScrollView style={styles.vendorContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.vendorHeader}>
        <Text style={styles.vendorTitle}>Restaurant Profile</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2e7d32" />
      ) : vendorData ? (
        <>
          <View style={styles.vendorInfoCard}>
            <Text style={styles.infoLabel}>Restaurant Name</Text>
            <Text style={styles.infoValue}>{vendorData.name}</Text>
          </View>

          <View style={styles.vendorInfoCard}>
            <Text style={styles.infoLabel}>Category</Text>
            <Text style={styles.infoValue}>{vendorData.category}</Text>
          </View>

          <View style={styles.vendorInfoCard}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{vendorData.address}</Text>
          </View>

          <View style={styles.vendorInfoCard}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{vendorData.phone}</Text>
          </View>

          <View style={styles.vendorInfoCard}>
            <Text style={styles.infoLabel}>Hours</Text>
            <Text style={styles.infoValue}>
              {vendorData.hours?.open} - {vendorData.hours?.close}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: '#d32f2f', marginTop: 32 }]}
            onPress={handleSignOut}
          >
            <Text style={styles.primaryButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </>
      ) : null}
    </ScrollView>
  );
}

function AppTabs() {
  const { user } = useAuth();

  // Show vendor dashboard for vendors, student home for students
  if (user?.role === 'vendor') {
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
          name="VendorDashboard"
          component={VendorDashboardScreen}
          options={{
            tabBarLabel: 'Dashboard',
            tabBarIcon: () => <Text style={{ fontSize: 24 }}>📊</Text>,
          }}
        />

        <Tab.Screen
          name="VendorMenu"
          component={VendorMenuScreen}
          options={{
            tabBarLabel: 'Menu',
            tabBarIcon: () => <Text style={{ fontSize: 24 }}>📋</Text>,
          }}
        />

        <Tab.Screen
          name="VendorOrders"
          component={VendorOrdersScreen}
          options={{
            tabBarLabel: 'Orders',
            tabBarIcon: () => <Text style={{ fontSize: 24 }}>📦</Text>,
          }}
        />

        <Tab.Screen
          name="VendorProfile"
          component={VendorProfileScreen}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: () => (
              <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3d8659', marginBottom: 2 }} />
                <View style={{ width: 14, height: 10, borderRadius: 7, backgroundColor: '#3d8659', marginTop: 2 }} />
              </View>
            ),
          }}
        />
      </Tab.Navigator>
    );
  }

  // Student tabs
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
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🍽️</Text>,
        }}
      />

      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>💬</Text>,
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: () => (
            <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3d8659', marginBottom: 2 }} />
              <View style={{ width: 14, height: 10, borderRadius: 7, backgroundColor: '#3d8659', marginTop: 2 }} />
            </View>
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
      <FavoritesProvider>
        <AppContent />
      </FavoritesProvider>
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
    backgroundColor: '#e8f5e9',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },

  // Auth Screens
  authContainer: {
    flex: 1,
    backgroundColor: '#e8f5e9',
  },
  scrollView: {
    flex: 1,
  },
  authContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100, // Reduced since we have scrollSpacer
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
  createHeader: {
    marginBottom: 48,
    alignItems: 'flex-start',
  },
  firstInput: {
    marginTop: 12,
  },
  scrollSpacer: {
    height: 200, // Extra space to ensure scrolling works
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b5e20',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
    marginTop: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff', 
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#c8e6c9',
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 14,
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
  // Role Selection
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b5e20',
    marginBottom: 24,
  },
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  roleCardSelected: {
    borderColor: '#2e7d32',
    backgroundColor: '#f1f8f6',
  },
  roleCardEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  roleCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  roleCardSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  selectContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#c8e6c9',
  },
  selectText: {
    fontSize: 16,
    color: '#333',
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
    backgroundColor: '#e8f5e9',
  },
  homeHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#3d8659',
    borderBottomWidth: 3,
    borderBottomColor: '#F4C430',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  homeTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
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
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 0,
    overflow: 'hidden',
  },
  listingImage: {
    width: 110,
    height: 110,
    borderRadius: 12,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#c8e6c9',
  },
  listingImagePlaceholder: {
    fontSize: 40,
  },
  listingInfo: {
    flex: 1,
  },
  listingName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1b5e20',
    marginBottom: 2,
  },
  listingRestaurant: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 6,
    fontWeight: '500',
  },
  listingTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  listingTag: {
    backgroundColor: '#c8e6c9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#a5d6a7',
  },
  listingTagText: {
    fontSize: 11,
    color: '#1b5e20',
    fontWeight: '600',
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
  listingNewPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2e7d32',
    marginRight: 8,
  },
  listingTime: {
    fontSize: 12,
    color: '#F4C430',
    fontWeight: '700',
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

  // Vendor Search
  browseToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 2,
  },
  browseToggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  browseToggleButtonActive: {
    backgroundColor: '#fff',
  },
  browseToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  browseToggleTextActive: {
    color: '#3d8659',
  },
  vendorSearchButton: {
    padding: 8,
  },
  vendorSearchButtonText: {
    fontSize: 24,
  },
  vendorBackButton: {
    fontSize: 24,
    color: '#fff',
    padding: 8,
  },
  vendorsList: {
    flex: 1,
    padding: 12,
  },
  vendorHeartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  vendorHeartIcon: {
    fontSize: 20,
  },
  vendorHeartIconOutline: {
    color: '#ccc',
  },
  vendorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  vendorCardContent: {
    flex: 1,
  },
  vendorCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 4,
  },
  vendorCardCount: {
    fontSize: 14,
    color: '#666',
  },
  vendorCardArrow: {
    fontSize: 24,
    color: '#3d8659',
    marginLeft: 12,
  },
  vendorMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#3d8659',
    borderBottomWidth: 3,
    borderBottomColor: '#F4C430',
  },
  vendorBackArrow: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    paddingHorizontal: 8,
  },
  vendorMenuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  vendorMenuList: {
    flex: 1,
    padding: 16,
  },
  vendorMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  vendorMenuItemInfo: {
    flex: 1,
  },
  vendorMenuItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 4,
  },
  vendorMenuItemCategory: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  vendorMenuItemTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  vendorMenuItemTag: {
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    marginBottom: 4,
  },
  vendorMenuItemTagText: {
    fontSize: 11,
    color: '#2e7d32',
    fontWeight: '600',
  },
  vendorMenuItemPrice: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  vendorMenuItemNewPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
  },
  vendorMenuItemOldPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },

  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    height: '80%',
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#3d8659',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#fff',
    padding: 4,
  },
  modalListings: {
    flex: 1,
    padding: 12,
  },  // Listing Detail
  detailContainer: {
    flex: 1,
    backgroundColor: '#e8f5e9',
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
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  reserveButtonDisabled: {
    backgroundColor: '#999',
  },
  reserveButtonText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Create Listing
  createContainer: {
    flex: 1,
    backgroundColor: '#e8f5e9',
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
    backgroundColor: '#e8f5e9',
  },
  messagesHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#3d8659',
    borderBottomWidth: 3,
    borderBottomColor: '#F4C430',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  messagesTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
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
    backgroundColor: '#e8f5e9',
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
    backgroundColor: '#e8f5e9',
  },
  profileHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#3d8659',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#F4C430',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
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
    color: '#fff',
    marginBottom: 4,
  },
  profileNameContainer: {
    alignItems: 'center',
  },
  profileFullName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  profileDisplayName: {
    fontSize: 16,
    color: '#fff',
    fontStyle: 'italic',
  },
  profileEmail: {
    fontSize: 14,
    color: '#fff',
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
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moneyCircle: {
    backgroundColor: '#4CAF50',
  },
  mealsCircle: {
    backgroundColor: '#FF9800',
  },
  donatedCircle: {
    backgroundColor: '#2196F3',
  },
  statCircleValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  statCircleLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
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
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 0,
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
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
  favoriteRemoveButton: {
    fontSize: 18,
    color: '#999',
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 0,
  },
  settingsItemText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  signOutText: {
    color: '#d32f2f',
  },
  settingsArrow: {
    fontSize: 20,
    color: '#999',
  },

  // ============ VENDOR STYLES ============
  vendorContainer: {
    flex: 1,
    backgroundColor: '#e8f5e9',
  },
  vendorHeader: {
    backgroundColor: '#2e7d32',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vendorTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  vendorSubtitle: {
    fontSize: 14,
    color: '#c8e6c9',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#2e7d32',
    fontWeight: '700',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2e7d32',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  sectionContainer: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b5e20',
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
  },
  menuItemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 4,
  },
  menuItemDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  menuItemPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
  },
  menuItemOriginal: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  menuItemServes: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f1f8f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#d32f2f',
    fontSize: 18,
    fontWeight: '700',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vendorOrderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  orderName: {
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
  orderTime: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  vendorInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2e7d32',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#999',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});
