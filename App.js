import * as React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Easing } from 'react-native'; 
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
    }
    // TODO: Implement navigation for Restaurant and Campus Organization screens
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
  return (
    <View style={styles.screen}>
      <Text style={styles.welcomeText}>Map Screen</Text>
    </View>
  );
}

function SearchScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.welcomeText}>Search Screen</Text>
    </View>
  );
}

function SocialsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.welcomeText}>Socials Screen</Text>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.welcomeText}>Profile Screen</Text>
    </View>
  );
}

function RestaurantPage() {
  return (
    <View style={styles.screen}>
      <Text style={styles.welcomeText}>Restaurant Detail Page</Text>
    </View>
  );
}

function CampusOrgsPage() {
  return (
    <View style={styles.screen}>
      <Text style={styles.welcomeText}>Campus Orgs Page</Text>
    </View>
  );
}
// --- END Placeholder Screen Components ---


function StudentTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Socials" component={SocialsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
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
});