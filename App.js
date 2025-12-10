import * as React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Easing, ScrollView, TextInput, Alert } from 'react-native'; 
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// Removed: import * as Icon from 'react-native-feather'; 

// Define navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// --- Landing Screen Component (REVERTED LOGO) ---
function LandingScreen() {
  const navigation = useNavigation();

  // 1. Setup Animation Values for Text (Slide-up and Fade-in)
  const textFadeAnim = React.useRef(new Animated.Value(0)).current; 
  const textSlideAnim = React.useRef(new Animated.Value(30)).current; 

  // 2. Setup Animation Values for Buttons (Staggered Pop-up)
  const buttonAnim1 = React.useRef(new Animated.Value(0)).current;
  const buttonAnim2 = React.useRef(new Animated.Value(0)).current;
  const buttonAnim3 = React.useRef(new Animated.Value(0)).current;
  
  // 3. Animation for subtle background elements (Rotation)
  const bgAnim = React.useRef(new Animated.Value(0)).current;
  
  // Removed: Animation for Logo (Scale/Pop)

  // 4. Start Animations on mount
  React.useEffect(() => {
    // Animate text elements simultaneously (STARTING animation sequence here)
    Animated.parallel([
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(textSlideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ]).start();

    // Animate buttons with a slight delay (stagger) for the pop-up effect
    Animated.stagger(150, [
      Animated.spring(buttonAnim1, { toValue: 1, useNativeDriver: true, friction: 5 }),
      Animated.spring(buttonAnim2, { toValue: 1, useNativeDriver: true, friction: 5 }),
      Animated.spring(buttonAnim3, { toValue: 1, useNativeDriver: true, friction: 5 }),
    ]).start();
    
    // Animate background circles with a slow loop
    Animated.loop(
      Animated.timing(bgAnim, {
        toValue: 1,
        duration: 30000, // 30 seconds for a full rotation
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [textFadeAnim, textSlideAnim, buttonAnim1, buttonAnim2, buttonAnim3, bgAnim]); // Removed logoAnim from dependency array

  // Define animation styles based on animated values
  const textAnimatedStyle = {
    opacity: textFadeAnim,
    transform: [{ translateY: textSlideAnim }],
  };
  
  // Removed: Logo Animation Style
  
  // Define button animation styles (scale and opacity)
  const createButtonStyle = (animValue) => ({ 
    opacity: animValue, 
    transform: [{ 
      scale: animValue.interpolate({ 
        inputRange: [0, 1], 
        outputRange: [0.8, 1] // Starts smaller, pops up to full size
      }) 
    }] 
  });
  
  // Define background rotation style
  const rotation = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleUserTypeSelection = (userType) => {
    console.log(`User selected: ${userType}`);
    
    if (userType === 'Student') {
        navigation.replace('StudentTabs');
    } else if (userType === 'Restaurant') {
        navigation.replace('RestaurantPage');
    } else if (userType === 'Campus Organization') {
        navigation.replace('CampusOrgsPage');
    }
  };

  return (
    <View style={styles.landingContainer}>
      {/* BACKGROUND ELEMENTS (Subtle Animated Circles) */}
      <Animated.View style={[styles.backgroundCircle, styles.circleTop, { transform: [{ rotate: rotation }] }]} />
      <Animated.View style={[styles.backgroundCircle, styles.circleBottom, { transform: [{ rotate: rotation }] }]} />

      {/* FOREGROUND CONTENT WRAPPER */}
      <View style={styles.contentWrapper}>
          
          {/* Removed: Animated Logo Container */}
          
          {/* Animated Text Elements */}
          <Animated.Text style={[styles.welcomeText, textAnimatedStyle]}>Welcome to Savorly!</Animated.Text>
          <Animated.Text style={[styles.subtitle, textAnimatedStyle]}>Eat better, spend less, waste none.</Animated.Text>
          <Animated.Text style={[styles.promptText, textAnimatedStyle]}>Sign in as:</Animated.Text>
          
          {/* Buttons wrapped in Animated.View for the pop-up animation */}
          
          {/* Student Button */}
          <Animated.View style={[createButtonStyle(buttonAnim1), styles.buttonWrapper]}>
              <TouchableOpacity
                  style={styles.button}
                  onPress={() => handleUserTypeSelection('Student')}
              >
                  <Text style={styles.buttonText}>Student</Text>
              </TouchableOpacity>
          </Animated.View>

          {/* Restaurant Button */}
          <Animated.View style={[createButtonStyle(buttonAnim2), styles.buttonWrapper]}>
              <TouchableOpacity
                  style={styles.buttonSecondary} 
                  onPress={() => handleUserTypeSelection('Restaurant')}
              >
                  <Text style={styles.buttonTextSecondary}>Restaurant</Text>
              </TouchableOpacity>
          </Animated.View>
          
          {/* Campus Organization Button */}
          <Animated.View style={[createButtonStyle(buttonAnim3), styles.buttonWrapper]}>
              <TouchableOpacity
                  style={styles.buttonSecondary} 
                  onPress={() => handleUserTypeSelection('Campus Organization')}
              >
                  <Text style={styles.buttonTextSecondary}>Campus Organization</Text>
              </TouchableOpacity>
          </Animated.View>
      </View>
    </View>
  );
}

// --- Placeholder Screen Components (No Change) ---
function MapScreen() {
  const navigation = useNavigation();
  
  // Sample restaurant data
  const nearbyRestaurants = [
    {
      id: 1,
      name: 'Campus Cafe',
      distance: '0.3 mi',
      discount: '30% off',
      timeLeft: '2 hours left',
      description: 'Fresh sandwiches & salads',
      category: 'Cafe',
    },
    {
      id: 2,
      name: 'Pizza Palace',
      distance: '0.5 mi',
      discount: '50% off',
      timeLeft: '1 hour left',
      description: 'Large pizzas, perfect for sharing',
      category: 'Italian',
    },
    {
      id: 3,
      name: 'Green Bowl',
      distance: '0.7 mi',
      discount: '25% off',
      timeLeft: '3 hours left',
      description: 'Healthy bowls & smoothies',
      category: 'Healthy',
    },
    {
      id: 4,
      name: 'Burger Barn',
      distance: '0.4 mi',
      discount: '40% off',
      timeLeft: '45 min left',
      description: 'Gourmet burgers & fries',
      category: 'American',
    },
  ];

  return (
    <View style={styles.mapScreenContainer}>
      {/* Header */}
      <View style={styles.mapHeader}>
        <Text style={styles.mapTitle}>Nearby Deals</Text>
        <Text style={styles.mapSubtitle}>Find discounted meals near you</Text>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapContent}>
          <Text style={styles.mapIcon}>📍</Text>
          <Text style={styles.mapText}>Map View</Text>
          <Text style={styles.mapHint}>Tap to view on map</Text>
        </View>
        {/* Map markers */}
        {nearbyRestaurants.map((restaurant, index) => (
          <View
            key={restaurant.id}
            style={[
              styles.mapMarker,
              {
                top: 20 + (index % 2) * 40 + '%',
                left: 30 + (index % 3) * 25 + '%',
              },
            ]}
          >
            <View style={styles.markerDot} />
            <View style={styles.markerLabel}>
              <Text style={styles.markerText}>{restaurant.discount}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Restaurant List */}
      <ScrollView style={styles.restaurantList} showsVerticalScrollIndicator={false}>
        {nearbyRestaurants.map((restaurant) => (
          <TouchableOpacity
            key={restaurant.id}
            style={styles.restaurantCard}
            onPress={() => navigation.navigate('RestaurantPage')}
          >
            <View style={styles.restaurantCardHeader}>
              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
                <Text style={styles.restaurantCategory}>{restaurant.category}</Text>
              </View>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{restaurant.discount}</Text>
              </View>
            </View>
            <Text style={styles.restaurantDescription}>{restaurant.description}</Text>
            <View style={styles.restaurantFooter}>
              <Text style={styles.restaurantDistance}>📍 {restaurant.distance}</Text>
              <Text style={styles.timeLeft}>⏰ {restaurant.timeLeft}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function SearchScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFilter, setSelectedFilter] = React.useState('All');

  // Sample search results data
  const allRestaurants = [
    {
      id: 1,
      name: 'Campus Cafe',
      category: 'Cafe',
      discount: '30% off',
      rating: 4.5,
      distance: '0.3 mi',
      tags: ['Vegetarian', 'Healthy'],
    },
    {
      id: 2,
      name: 'Pizza Palace',
      category: 'Italian',
      discount: '50% off',
      rating: 4.8,
      distance: '0.5 mi',
      tags: ['Popular', 'Fast'],
    },
    {
      id: 3,
      name: 'Green Bowl',
      category: 'Healthy',
      discount: '25% off',
      rating: 4.6,
      distance: '0.7 mi',
      tags: ['Vegetarian', 'Vegan'],
    },
    {
      id: 4,
      name: 'Burger Barn',
      category: 'American',
      discount: '40% off',
      rating: 4.3,
      distance: '0.4 mi',
      tags: ['Popular', 'Fast'],
    },
    {
      id: 5,
      name: 'Sushi Express',
      category: 'Japanese',
      discount: '35% off',
      rating: 4.7,
      distance: '0.6 mi',
      tags: ['Healthy', 'Fresh'],
    },
    {
      id: 6,
      name: 'Taco Fiesta',
      category: 'Mexican',
      discount: '45% off',
      rating: 4.4,
      distance: '0.8 mi',
      tags: ['Fast', 'Spicy'],
    },
  ];

  const filters = ['All', 'Cafe', 'Italian', 'Healthy', 'American', 'Japanese', 'Mexican'];

  // Filter restaurants based on search query and selected filter
  const filteredRestaurants = allRestaurants.filter((restaurant) => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         restaurant.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         restaurant.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = selectedFilter === 'All' || restaurant.category === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={styles.searchScreenContainer}>
      {/* Header */}
      <View style={styles.searchHeader}>
        <Text style={styles.searchTitle}>Search</Text>
        <Text style={styles.searchSubtitle}>Find your perfect meal</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants, cuisines, or tags..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      {/* Filter Chips */}
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
              selectedFilter === filter && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === filter && styles.filterChipTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'result' : 'results'}
        </Text>
      </View>

      {/* Search Results */}
      <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
        {filteredRestaurants.length === 0 ? (
          <View style={styles.noResults}>
            <Text style={styles.noResultsIcon}>🔍</Text>
            <Text style={styles.noResultsText}>No results found</Text>
            <Text style={styles.noResultsSubtext}>Try a different search term or filter</Text>
          </View>
        ) : (
          filteredRestaurants.map((restaurant) => (
            <TouchableOpacity
              key={restaurant.id}
              style={styles.searchResultCard}
              onPress={() => navigation.navigate('RestaurantPage')}
            >
              <View style={styles.searchResultHeader}>
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultName}>{restaurant.name}</Text>
                  <View style={styles.searchResultMeta}>
                    <Text style={styles.searchResultCategory}>{restaurant.category}</Text>
                    <Text style={styles.searchResultSeparator}>•</Text>
                    <Text style={styles.searchResultRating}>⭐ {restaurant.rating}</Text>
                    <Text style={styles.searchResultSeparator}>•</Text>
                    <Text style={styles.searchResultDistance}>📍 {restaurant.distance}</Text>
                  </View>
                </View>
                <View style={styles.searchDiscountBadge}>
                  <Text style={styles.searchDiscountText}>{restaurant.discount}</Text>
                </View>
              </View>
              <View style={styles.searchTagsContainer}>
                {restaurant.tags.map((tag, index) => (
                  <View key={index} style={styles.searchTag}>
                    <Text style={styles.searchTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function SocialsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = React.useState('Feed');
  const [likedPosts, setLikedPosts] = React.useState(new Set());

  const handleLike = (postId) => {
    const newLikedPosts = new Set(likedPosts);
    if (newLikedPosts.has(postId)) {
      newLikedPosts.delete(postId);
      Alert.alert('Unliked', 'You unliked this post.');
    } else {
      newLikedPosts.add(postId);
      Alert.alert('Liked! ❤️', 'You liked this post.');
    }
    setLikedPosts(newLikedPosts);
  };

  const handleComment = (post) => {
    Alert.alert(
      'Comments',
      `View comments for ${post.restaurant}'s post.\n\n${post.comments} comments`,
      [
        { text: 'Close' },
        { text: 'Add Comment', onPress: () => Alert.alert('Comment Added!', 'Your comment has been posted.') }
      ]
    );
  };

  const handleShare = (post) => {
    Alert.alert(
      'Share Post',
      `Share ${post.restaurant}'s deal: ${post.discount}`,
      [
        { text: 'Cancel' },
        { text: 'Share', onPress: () => Alert.alert('Shared!', 'Post shared successfully.') }
      ]
    );
  };

  // Sample social feed posts
  const feedPosts = [
    {
      id: 1,
      restaurant: 'Campus Cafe',
      username: 'foodie_sarah',
      avatar: '👩',
      time: '2h ago',
      content: 'Just got an amazing deal at Campus Cafe! 30% off on all sandwiches. The veggie wrap is incredible! 🥪✨',
      image: null,
      likes: 24,
      comments: 5,
      discount: '30% off',
    },
    {
      id: 2,
      restaurant: 'Pizza Palace',
      username: 'pizza_lover',
      avatar: '👨',
      time: '4h ago',
      content: 'Pizza Palace has 50% off large pizzas right now! Perfect for sharing with friends 🍕',
      image: null,
      likes: 42,
      comments: 12,
      discount: '50% off',
    },
    {
      id: 3,
      restaurant: 'Green Bowl',
      username: 'healthy_eats',
      avatar: '👩',
      time: '6h ago',
      content: 'Love the new acai bowl at Green Bowl! So fresh and healthy. 25% off today only! 🥗',
      image: null,
      likes: 18,
      comments: 3,
      discount: '25% off',
    },
    {
      id: 4,
      restaurant: 'Burger Barn',
      username: 'campus_food',
      avatar: '👨',
      time: '8h ago',
      content: 'Burger Barn is having a flash sale! 40% off all burgers for the next hour. Don\'t miss out! 🍔',
      image: null,
      likes: 56,
      comments: 18,
      discount: '40% off',
    },
  ];

  const tabs = ['Feed', 'Deals', 'Following'];

  return (
    <View style={styles.socialsScreenContainer}>
      {/* Header */}
      <View style={styles.socialsHeader}>
        <Text style={styles.socialsTitle}>Social Feed</Text>
        <Text style={styles.socialsSubtitle}>Discover deals and connect</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feed Content */}
      <ScrollView style={styles.feedContainer} showsVerticalScrollIndicator={false}>
        {activeTab === 'Feed' && feedPosts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <View style={styles.postAvatar}>
                <Text style={styles.avatarText}>{post.avatar}</Text>
              </View>
              <View style={styles.postUserInfo}>
                <Text style={styles.postUsername}>{post.username}</Text>
                <Text style={styles.postTime}>{post.time}</Text>
              </View>
              <View style={styles.postDiscountBadge}>
                <Text style={styles.postDiscountText}>{post.discount}</Text>
              </View>
            </View>

            {/* Restaurant Name */}
            <TouchableOpacity
              style={styles.postRestaurant}
              onPress={() => navigation.navigate('RestaurantPage')}
            >
              <Text style={styles.postRestaurantText}>📍 {post.restaurant}</Text>
            </TouchableOpacity>

            {/* Post Content */}
            <Text style={styles.postContent}>{post.content}</Text>

            {/* Post Actions */}
            <View style={styles.postActions}>
              <TouchableOpacity
                style={styles.postAction}
                onPress={() => handleLike(post.id)}
              >
                <Text style={styles.postActionIcon}>
                  {likedPosts.has(post.id) ? '❤️' : '🤍'}
                </Text>
                <Text style={styles.postActionText}>{post.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.postAction}
                onPress={() => handleComment(post)}
              >
                <Text style={styles.postActionIcon}>💬</Text>
                <Text style={styles.postActionText}>{post.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.postAction}
                onPress={() => handleShare(post)}
              >
                <Text style={styles.postActionIcon}>🔗</Text>
                <Text style={styles.postActionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {activeTab === 'Deals' && (
          <View style={styles.dealsContainer}>
            <Text style={styles.sectionTitle}>Trending Deals</Text>
            {feedPosts
              .sort((a, b) => b.likes - a.likes)
              .map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.dealCard}
                  onPress={() => navigation.navigate('RestaurantPage')}
                >
                  <View style={styles.dealCardHeader}>
                    <Text style={styles.dealRestaurantName}>{post.restaurant}</Text>
                    <View style={styles.dealBadge}>
                      <Text style={styles.dealBadgeText}>{post.discount}</Text>
                    </View>
                  </View>
                  <Text style={styles.dealContent}>{post.content}</Text>
                  <View style={styles.dealStats}>
                    <Text style={styles.dealStat}>❤️ {post.likes} likes</Text>
                    <Text style={styles.dealStat}>💬 {post.comments} comments</Text>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {activeTab === 'Following' && (
          <View style={styles.followingContainer}>
            <Text style={styles.sectionTitle}>Your Followed Restaurants</Text>
            {feedPosts.slice(0, 3).map((post) => (
              <TouchableOpacity
                key={post.id}
                style={styles.followingCard}
                onPress={() => navigation.navigate('RestaurantPage')}
              >
                <View style={styles.followingAvatar}>
                  <Text style={styles.followingAvatarText}>🏪</Text>
                </View>
                <View style={styles.followingInfo}>
                  <Text style={styles.followingName}>{post.restaurant}</Text>
                  <Text style={styles.followingStatus}>Active deal: {post.discount}</Text>
                </View>
                <Text style={styles.followingArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ProfileScreen() {
  const navigation = useNavigation();

  // Sample user data
  const userData = {
    name: 'Sarah Johnson',
    email: 'sarah.j@university.edu',
    avatar: '👩',
    memberSince: '2024',
    savedRestaurants: 8,
    dealsClaimed: 24,
    totalSavings: '$156.50',
  };

  const savedRestaurants = [
    { id: 1, name: 'Campus Cafe', category: 'Cafe' },
    { id: 2, name: 'Pizza Palace', category: 'Italian' },
    { id: 3, name: 'Green Bowl', category: 'Healthy' },
    { id: 4, name: 'Burger Barn', category: 'American' },
  ];

  const menuItems = [
    { id: 1, icon: '⚙️', title: 'Settings', subtitle: 'Account & preferences' },
    { id: 2, icon: '🔔', title: 'Notifications', subtitle: 'Manage alerts' },
    { id: 3, icon: '💳', title: 'Payment Methods', subtitle: 'Cards & billing' },
    { id: 4, icon: '📖', title: 'Help & Support', subtitle: 'FAQs & contact' },
    { id: 5, icon: '📜', title: 'Terms & Privacy', subtitle: 'Legal information' },
    { id: 6, icon: '🚪', title: 'Sign Out', subtitle: 'Log out of your account' },
  ];

  return (
    <ScrollView style={styles.profileScreenContainer} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.profileHeader}>
        <Text style={styles.profileTitle}>Profile</Text>
      </View>

      {/* User Info Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatarContainer}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{userData.avatar}</Text>
          </View>
        </View>
        <Text style={styles.profileName}>{userData.name}</Text>
        <Text style={styles.profileEmail}>{userData.email}</Text>
        <Text style={styles.profileMemberSince}>Member since {userData.memberSince}</Text>
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userData.savedRestaurants}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userData.dealsClaimed}</Text>
          <Text style={styles.statLabel}>Deals</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userData.totalSavings}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
      </View>

      {/* Saved Restaurants */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Saved Restaurants</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.savedRestaurantsList}>
          {savedRestaurants.map((restaurant) => (
            <TouchableOpacity
              key={restaurant.id}
              style={styles.savedRestaurantCard}
              onPress={() => navigation.navigate('RestaurantPage')}
            >
              <View style={styles.savedRestaurantIcon}>
                <Text style={styles.savedRestaurantIconText}>🍽️</Text>
              </View>
              <Text style={styles.savedRestaurantName}>{restaurant.name}</Text>
              <Text style={styles.savedRestaurantCategory}>{restaurant.category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Menu Items */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Account</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => {
              if (item.title === 'Sign Out') {
                // Handle sign out - navigate back to landing
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Landing' }],
                });
              }
            }}
          >
            <Text style={styles.menuItemIcon}>{item.icon}</Text>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>{item.title}</Text>
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>Savorly v1.0.0</Text>
        <Text style={styles.appInfoText}>© 2024 Savorly. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

function RestaurantPage() {
  const navigation = useNavigation();
  const [isSaved, setIsSaved] = React.useState(false);

  // Sample restaurant data
  const restaurant = {
    name: 'Campus Cafe',
    category: 'Cafe',
    rating: 4.5,
    distance: '0.3 mi',
    address: '123 University Ave, Campus',
    phone: '(555) 123-4567',
    hours: 'Mon-Fri: 8am-8pm',
    discount: '30% off',
    timeLeft: '2 hours left',
    description: 'Fresh sandwiches, salads, and coffee. Perfect for students on the go!',
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    Alert.alert(
      isSaved ? 'Removed from Saved' : 'Saved!',
      isSaved 
        ? `${restaurant.name} has been removed from your saved restaurants.`
        : `${restaurant.name} has been saved to your profile.`,
      [{ text: 'OK' }]
    );
  };

  const handleClaimDeal = () => {
    Alert.alert(
      'Deal Claimed! 🎉',
      `You've successfully claimed the ${restaurant.discount} deal at ${restaurant.name}. Show this confirmation at checkout.`,
      [
        { text: 'OK', style: 'default' },
        { text: 'Share Deal', onPress: () => Alert.alert('Shared!', 'Deal shared with friends.') }
      ]
    );
  };

  const menuItems = [
    { id: 1, name: 'Veggie Wrap', price: '$8.99', discount: '$6.29', category: 'Sandwiches' },
    { id: 2, name: 'Chicken Caesar Salad', price: '$9.99', discount: '$6.99', category: 'Salads' },
    { id: 3, name: 'Turkey Club', price: '$10.99', discount: '$7.69', category: 'Sandwiches' },
    { id: 4, name: 'Acai Bowl', price: '$7.99', discount: '$5.59', category: 'Healthy' },
    { id: 5, name: 'Cappuccino', price: '$4.50', discount: '$3.15', category: 'Beverages' },
    { id: 6, name: 'Fresh Smoothie', price: '$5.99', discount: '$4.19', category: 'Beverages' },
  ];

  const reviews = [
    { id: 1, username: 'foodie_sarah', rating: 5, comment: 'Amazing deals and fresh food!', time: '2 days ago' },
    { id: 2, username: 'student_life', rating: 4, comment: 'Great value for money. Love the veggie wrap!', time: '5 days ago' },
    { id: 3, username: 'campus_eats', rating: 5, comment: 'Best cafe on campus. Highly recommend!', time: '1 week ago' },
  ];

  return (
    <ScrollView style={styles.restaurantPageContainer} showsVerticalScrollIndicator={false}>
      {/* Header with Back Button */}
      <View style={styles.restaurantHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{isSaved ? '✓ Saved' : '💾 Save'}</Text>
        </TouchableOpacity>
      </View>

      {/* Restaurant Hero Section */}
      <View style={styles.restaurantHero}>
        <View style={styles.restaurantHeroImage}>
          <Text style={styles.restaurantHeroIcon}>🍽️</Text>
        </View>
        <View style={styles.restaurantHeroBadge}>
          <Text style={styles.restaurantHeroBadgeText}>{restaurant.discount}</Text>
        </View>
      </View>

      {/* Restaurant Info */}
      <View style={styles.restaurantInfoCard}>
        <View style={styles.restaurantInfoHeader}>
          <View style={styles.restaurantInfoMain}>
            <Text style={styles.restaurantInfoName}>{restaurant.name}</Text>
            <Text style={styles.restaurantInfoCategory}>{restaurant.category}</Text>
          </View>
          <View style={styles.restaurantRating}>
            <Text style={styles.restaurantRatingText}>⭐ {restaurant.rating}</Text>
          </View>
        </View>

        <Text style={styles.restaurantDescription}>{restaurant.description}</Text>

        <View style={styles.restaurantDetails}>
          <View style={styles.restaurantDetailItem}>
            <Text style={styles.restaurantDetailIcon}>📍</Text>
            <Text style={styles.restaurantDetailText}>{restaurant.address}</Text>
          </View>
          <View style={styles.restaurantDetailItem}>
            <Text style={styles.restaurantDetailIcon}>📞</Text>
            <Text style={styles.restaurantDetailText}>{restaurant.phone}</Text>
          </View>
          <View style={styles.restaurantDetailItem}>
            <Text style={styles.restaurantDetailIcon}>🕐</Text>
            <Text style={styles.restaurantDetailText}>{restaurant.hours}</Text>
          </View>
          <View style={styles.restaurantDetailItem}>
            <Text style={styles.restaurantDetailIcon}>⏰</Text>
            <Text style={[styles.restaurantDetailText, styles.timeLeftText]}>
              {restaurant.timeLeft}
            </Text>
          </View>
        </View>
      </View>

      {/* Claim Deal Button */}
      <TouchableOpacity style={styles.claimDealButton} onPress={handleClaimDeal}>
        <Text style={styles.claimDealButtonText}>Claim {restaurant.discount} Deal</Text>
      </TouchableOpacity>

      {/* Menu Section */}
      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>Menu (with discount)</Text>
        {menuItems.map((item) => (
          <View key={item.id} style={styles.menuItemCard}>
            <View style={styles.menuItemInfo}>
              <Text style={styles.menuItemName}>{item.name}</Text>
              <Text style={styles.menuItemCategory}>{item.category}</Text>
            </View>
            <View style={styles.menuItemPricing}>
              <Text style={styles.menuItemOldPrice}>{item.price}</Text>
              <Text style={styles.menuItemNewPrice}>{item.discount}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Reviews Section */}
      <View style={styles.reviewsSection}>
        <Text style={styles.reviewsSectionTitle}>Reviews</Text>
        {reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewUsername}>{review.username}</Text>
              <View style={styles.reviewRating}>
                <Text style={styles.reviewRatingText}>
                  {'⭐'.repeat(review.rating)}
                </Text>
              </View>
            </View>
            <Text style={styles.reviewComment}>{review.comment}</Text>
            <Text style={styles.reviewTime}>{review.time}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function CampusOrgsPage() {
  const navigation = useNavigation();

  // Sample organization data
  const orgData = {
    name: 'Campus Food Rescue',
    type: 'Student Organization',
    members: 45,
    eventsHosted: 12,
    mealsRescued: 320,
  };

  const handleQuickAction = (actionTitle) => {
    const messages = {
      'Create Event': 'Event creation form would open here.',
      'Manage Members': 'Member management screen would open here.',
      'View Analytics': 'Analytics dashboard would open here.',
      'Partner Restaurants': 'Restaurant partnership screen would open here.',
    };
    Alert.alert(actionTitle, messages[actionTitle] || 'Feature coming soon!');
  };

  const handleEventButton = (event) => {
    if (event.status === 'Upcoming') {
      Alert.alert(
        event.title,
        `Date: ${event.date}\nTime: ${event.time}\nLocation: ${event.location}\n\n${event.participants} participants registered.`,
        [
          { text: 'Close' },
          { text: 'RSVP', onPress: () => Alert.alert('RSVP Confirmed!', 'You\'ve registered for this event.') }
        ]
      );
    } else {
      Alert.alert(
        event.title,
        `This event was completed on ${event.date}.\n\n${event.participants} participants attended.\n\nView full summary and photos.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleSettings = () => {
    Alert.alert('Organization Settings', 'Settings screen would open here.');
  };

  const handleSeeAllEvents = () => {
    Alert.alert('All Events', 'Full events list would open here.');
  };

  const upcomingEvents = [
    {
      id: 1,
      title: 'Food Drive - Spring 2024',
      date: 'March 15, 2024',
      time: '10:00 AM - 2:00 PM',
      location: 'Student Center',
      participants: 28,
      status: 'Upcoming',
    },
    {
      id: 2,
      title: 'Community Meal Share',
      date: 'March 22, 2024',
      time: '5:00 PM - 7:00 PM',
      location: 'Campus Green',
      participants: 15,
      status: 'Upcoming',
    },
    {
      id: 3,
      title: 'Sustainability Workshop',
      date: 'March 8, 2024',
      time: '3:00 PM - 4:30 PM',
      location: 'Library Hall',
      participants: 42,
      status: 'Completed',
    },
  ];

  const quickActions = [
    { id: 1, icon: '📅', title: 'Create Event', subtitle: 'Organize a food event' },
    { id: 2, icon: '👥', title: 'Manage Members', subtitle: 'View and invite members' },
    { id: 3, icon: '📊', title: 'View Analytics', subtitle: 'Track your impact' },
    { id: 4, icon: '🤝', title: 'Partner Restaurants', subtitle: 'Connect with restaurants' },
  ];

  return (
    <ScrollView style={styles.orgPageContainer} showsVerticalScrollIndicator={false}>
      {/* Header with Back Button */}
      <View style={styles.orgHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.orgSettingsButton} onPress={handleSettings}>
          <Text style={styles.orgSettingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Organization Info Card */}
      <View style={styles.orgInfoCard}>
        <View style={styles.orgAvatarContainer}>
          <View style={styles.orgAvatar}>
            <Text style={styles.orgAvatarText}>🏛️</Text>
          </View>
        </View>
        <Text style={styles.orgName}>{orgData.name}</Text>
        <Text style={styles.orgType}>{orgData.type}</Text>
      </View>

      {/* Stats Card */}
      <View style={styles.orgStatsCard}>
        <View style={styles.orgStatItem}>
          <Text style={styles.orgStatValue}>{orgData.members}</Text>
          <Text style={styles.orgStatLabel}>Members</Text>
        </View>
        <View style={styles.orgStatDivider} />
        <View style={styles.orgStatItem}>
          <Text style={styles.orgStatValue}>{orgData.eventsHosted}</Text>
          <Text style={styles.orgStatLabel}>Events</Text>
        </View>
        <View style={styles.orgStatDivider} />
        <View style={styles.orgStatItem}>
          <Text style={styles.orgStatValue}>{orgData.mealsRescued}</Text>
          <Text style={styles.orgStatLabel}>Meals</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionCard}
              onPress={() => handleQuickAction(action.title)}
            >
              <Text style={styles.quickActionIcon}>{action.icon}</Text>
              <Text style={styles.quickActionTitle}>{action.title}</Text>
              <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Upcoming Events */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Events</Text>
          <TouchableOpacity onPress={handleSeeAllEvents}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {upcomingEvents.map((event) => (
          <View key={event.id} style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDate}>{event.date} • {event.time}</Text>
                <Text style={styles.eventLocation}>📍 {event.location}</Text>
              </View>
              <View style={[
                styles.eventStatusBadge,
                event.status === 'Completed' && styles.eventStatusBadgeCompleted
              ]}>
                <Text style={styles.eventStatusText}>{event.status}</Text>
              </View>
            </View>
            <View style={styles.eventFooter}>
              <Text style={styles.eventParticipants}>👥 {event.participants} participants</Text>
              <TouchableOpacity
                style={styles.eventButton}
                onPress={() => handleEventButton(event)}
              >
                <Text style={styles.eventButtonText}>
                  {event.status === 'Upcoming' ? 'View Details' : 'View Summary'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Mission Statement */}
      <View style={styles.missionCard}>
        <Text style={styles.missionTitle}>Our Mission</Text>
        <Text style={styles.missionText}>
          We work to reduce food waste on campus and provide affordable meals to students 
          through partnerships with local restaurants and community events.
        </Text>
      </View>
    </ScrollView>
  );
}
// --- END Placeholder Screen Components ---


function StudentTabs() {
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
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24 }}>📍</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24 }}>🔍</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Socials"
        component={SocialsScreen}
        options={{
          tabBarLabel: 'Socials',
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


export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="StudentTabs" component={StudentTabs} />
        <Stack.Screen name="RestaurantPage" component={RestaurantPage} />
        <Stack.Screen name="CampusOrgsPage" component={CampusOrgsPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


// ---------------------- Styles (LOGO STYLES REMOVED) ----------------------
const styles = StyleSheet.create({
  landingContainer: {
    flex: 1,
    backgroundColor: '#f5fff5', // Very light, clean background
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  contentWrapper: { 
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10, 
    width: '100%',
  },
  
  // Removed: LOGO STYLES (logoContainer and logoIcon)
  
  // --- BACKGROUND STYLES ---
  backgroundCircle: { 
    position: 'absolute',
    width: 500, 
    height: 500,
    borderRadius: 250,
    opacity: 0.04, 
  },
  circleTop: {
    top: -150,
    right: -150,
    backgroundColor: '#d4af37', // Faint gold
  },
  circleBottom: {
    bottom: -200,
    left: -200,
    backgroundColor: '#2e7d32', // Faint deep green
  },
  
  // --- TEXT & BUTTON STYLES ---
  welcomeText: {
    fontSize: 40, 
    fontWeight: '800', 
    color: '#2e7d32', 
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#4e4e4e',
    marginBottom: 40, 
    textAlign: 'center',
  },
  promptText: { 
    fontSize: 20,
    fontWeight: '600',
    color: '#2e7d32',
    marginTop: 20,
    marginBottom: 10,
  },
  buttonWrapper: { 
    width: '75%',
    marginVertical: 8,
  },
  button: { 
    backgroundColor: '#d4af37', // gold
    paddingVertical: 15,
    borderRadius: 12,
    
    shadowColor: '#a88f28', 
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10, 
  },
  buttonSecondary: { 
    backgroundColor: '#fff', 
    borderWidth: 2,
    borderColor: '#d4af37', 
    paddingVertical: 15,
    borderRadius: 12,
    
    shadowColor: '#000000', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonText: { 
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700', 
    color: 'white',
  },
  buttonTextSecondary: { 
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700', 
    color: '#2e7d32', 
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  // --- MapScreen Styles ---
  mapScreenContainer: {
    flex: 1,
    backgroundColor: '#f5fff5',
  },
  mapHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  mapTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2e7d32',
    marginBottom: 4,
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  mapPlaceholder: {
    height: 250,
    backgroundColor: '#e8f5e9',
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#c8e6c9',
  },
  mapContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  mapText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 4,
  },
  mapHint: {
    fontSize: 12,
    color: '#666',
  },
  mapMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#d4af37',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerLabel: {
    marginTop: 4,
    backgroundColor: '#2e7d32',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  markerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  restaurantList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  restaurantCard: {
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
  restaurantCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 4,
  },
  restaurantCategory: {
    fontSize: 14,
    color: '#666',
  },
  discountBadge: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  discountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  restaurantDescription: {
    fontSize: 14,
    color: '#4e4e4e',
    marginBottom: 12,
    lineHeight: 20,
  },
  restaurantFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  restaurantDistance: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  timeLeft: {
    fontSize: 13,
    color: '#d4af37',
    fontWeight: '600',
  },
  // --- SearchScreen Styles ---
  searchScreenContainer: {
    flex: 1,
    backgroundColor: '#f5fff5',
  },
  searchHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2e7d32',
    marginBottom: 4,
  },
  searchSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8e8e8',
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
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchResultCard: {
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
  searchResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 6,
  },
  searchResultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchResultCategory: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  searchResultSeparator: {
    fontSize: 13,
    color: '#ccc',
    marginHorizontal: 6,
  },
  searchResultRating: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  searchResultDistance: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  searchDiscountBadge: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  searchDiscountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  searchTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  searchTag: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  searchTagText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '500',
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noResultsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  // --- SocialsScreen Styles ---
  socialsScreenContainer: {
    flex: 1,
    backgroundColor: '#f5fff5',
  },
  socialsHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  socialsTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2e7d32',
    marginBottom: 4,
  },
  socialsSubtitle: {
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
  feedContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
  },
  postUserInfo: {
    flex: 1,
  },
  postUsername: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
    color: '#999',
  },
  postDiscountBadge: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  postDiscountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  postRestaurant: {
    marginBottom: 12,
  },
  postRestaurantText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2e7d32',
  },
  postContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  postActionIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  postActionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dealsContainer: {
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 16,
  },
  dealCard: {
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
  dealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dealRestaurantName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32',
  },
  dealBadge: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dealBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  dealContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  dealStats: {
    flexDirection: 'row',
    gap: 16,
  },
  dealStat: {
    fontSize: 13,
    color: '#999',
  },
  followingContainer: {
    paddingBottom: 16,
  },
  followingCard: {
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
  followingAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  followingAvatarText: {
    fontSize: 24,
  },
  followingInfo: {
    flex: 1,
  },
  followingName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 4,
  },
  followingStatus: {
    fontSize: 13,
    color: '#666',
  },
  followingArrow: {
    fontSize: 20,
    color: '#999',
  },
  // --- ProfileScreen Styles ---
  profileScreenContainer: {
    flex: 1,
    backgroundColor: '#f5fff5',
  },
  profileHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2e7d32',
  },
  profileCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  profileAvatarContainer: {
    marginBottom: 16,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  profileMemberSince: {
    fontSize: 14,
    color: '#999',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
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
  sectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 16,
  },
  savedRestaurantsList: {
    marginTop: -8,
  },
  savedRestaurantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  savedRestaurantIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  savedRestaurantIconText: {
    fontSize: 24,
  },
  savedRestaurantName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 4,
    textAlign: 'center',
  },
  savedRestaurantCategory: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  menuItem: {
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
  menuItemIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  menuItemArrow: {
    fontSize: 20,
    color: '#999',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 40,
  },
  appInfoText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  // --- RestaurantPage Styles ---
  restaurantPageContainer: {
    flex: 1,
    backgroundColor: '#f5fff5',
  },
  restaurantHeader: {
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
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
  },
  restaurantHero: {
    height: 200,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    margin: 16,
    borderRadius: 16,
  },
  restaurantHeroImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantHeroIcon: {
    fontSize: 80,
  },
  restaurantHeroBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#d4af37',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  restaurantHeroBadgeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  restaurantInfoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
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
  restaurantInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  restaurantInfoMain: {
    flex: 1,
  },
  restaurantInfoName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2e7d32',
    marginBottom: 4,
  },
  restaurantInfoCategory: {
    fontSize: 16,
    color: '#666',
  },
  restaurantRating: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  restaurantRatingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
  },
  restaurantDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  restaurantDetails: {
    marginTop: 12,
  },
  restaurantDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantDetailIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
  },
  restaurantDetailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  timeLeftText: {
    color: '#d4af37',
    fontWeight: '600',
  },
  claimDealButton: {
    backgroundColor: '#d4af37',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#a88f28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  claimDealButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  menuSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  menuSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 16,
  },
  menuItemCard: {
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
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuItemCategory: {
    fontSize: 13,
    color: '#999',
  },
  menuItemPricing: {
    alignItems: 'flex-end',
  },
  menuItemOldPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  menuItemNewPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32',
  },
  reviewsSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  reviewsSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 16,
  },
  reviewCard: {
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
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUsername: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewRatingText: {
    fontSize: 14,
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewTime: {
    fontSize: 12,
    color: '#999',
  },
  // --- CampusOrgsPage Styles ---
  orgPageContainer: {
    flex: 1,
    backgroundColor: '#f5fff5',
  },
  orgHeader: {
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
  orgSettingsButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  orgSettingsButtonText: {
    fontSize: 20,
  },
  orgInfoCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  orgAvatarContainer: {
    marginBottom: 16,
  },
  orgAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgAvatarText: {
    fontSize: 40,
  },
  orgName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 4,
    textAlign: 'center',
  },
  orgType: {
    fontSize: 16,
    color: '#666',
  },
  orgStatsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
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
  orgStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  orgStatDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  orgStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2e7d32',
    marginBottom: 4,
  },
  orgStatLabel: {
    fontSize: 14,
    color: '#666',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
  },
  eventCard: {
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
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 6,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
  },
  eventStatusBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  eventStatusBadgeCompleted: {
    backgroundColor: '#f0f0f0',
  },
  eventStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2e7d32',
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  eventParticipants: {
    fontSize: 13,
    color: '#666',
  },
  eventButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  eventButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  missionCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 24,
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
  missionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 12,
  },
  missionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});