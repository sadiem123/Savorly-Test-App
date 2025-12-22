import React, { useEffect, useRef, useCallback } from 'react';
import { 
    View, 
    Text, 
    Pressable, // Used for hover functionality
    StyleSheet, 
    Animated, 
    Dimensions, 
    Alert, // Used for displaying login success/failure messages
    Easing 
} from 'react-native';
import { authorize } from 'react-native-app-auth'; // Library for CalNet SSO

const { width, height } = Dimensions.get('window');

// --- CalNet Configuration (PLACEHOLDERS: MUST BE UPDATED) ---
// Note: This configuration is essential for the secure SSO process.
const calnetConfig = {
    // 1. Must match the scheme defined in your native project files (Info.plist/AndroidManifest.xml)
    redirectUrl: 'savorly://oauth/callback', 
    
    // 2. Client ID provided by CalNet/UC Berkeley IT
    clientId: 'YOUR_CALNET_CLIENT_ID', 

    // 3. CalNet's OIDC Issuer URL (Verify this with CalNet Developer Docs)
    issuer: 'https://auth.berkeley.edu', 
    
    // 4. Requested user information (openid is required for OIDC)
    scopes: ['openid', 'profile', 'email', 'calnetuid'], 
};
// --- END CalNet Config ---

export default function WelcomeScreen({ navigation }) {
  // --- Background Bubble Animation Setup (Unchanged) ---
  const bubbles = Array.from({ length: 8 }).map(() => ({
    x: new Animated.Value(Math.random() * width),
    y: new Animated.Value(Math.random() * height),
    size: 80 + Math.random() * 100,
    delay: Math.random() * 3000,
    speed: 8000 + Math.random() * 6000,
  }));

  useEffect(() => {
    bubbles.forEach(bubble => {
      const animate = () => {
        bubble.x.setValue(Math.random() * width);
        bubble.y.setValue(height + 200);

        Animated.parallel([
          Animated.timing(bubble.y, {
            toValue: -200,
            duration: bubble.speed,
            delay: bubble.delay,
            useNativeDriver: true,
          }),
          Animated.timing(bubble.x, {
            toValue: Math.random() * width,
            duration: bubble.speed * 1.1,
            useNativeDriver: true,
          }),
        ]).start(() => animate());
      };
      animate();
    });
  }, []);
  
  // --- NEW: HOVER ANIMATION VALUES ---
  const hoverAnimStudent = useRef(new Animated.Value(1)).current;
  const hoverAnimRestaurant = useRef(new Animated.Value(1)).current;
  const hoverAnimOrg = useRef(new Animated.Value(1)).current;

  // --- NEW: HOVER ANIMATION FUNCTIONS ---
  const handleHoverIn = useCallback((animValue) => {
    Animated.timing(animValue, {
      toValue: 1.05, // Scale up 5%
      duration: 150,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const handleHoverOut = useCallback((animValue) => {
    Animated.timing(animValue, {
      toValue: 1, // Back to original size
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);
  
  // --- NEW: CALNET AUTH HANDLER ---
  const handleCalnetAuth = async () => {
    try {
      // Initiate the Authorization Code Flow with PKCE
      const result = await authorize(calnetConfig);
      
      console.log('CalNet Auth Successful:', result);
      
      Alert.alert("Login Success!", "CalNet authentication verified. Welcome, Student!");

      // Navigate to the student view
      // Note: If you want to use the StudentTabs navigator, change 'StudentHome' to the stack name (e.g., 'StudentTabs')
      navigation.navigate('StudentHome'); 

    } catch (error) {
      console.error('CalNet Authentication Error:', error);
      // Display error to the user
      Alert.alert("Login Failed", "Could not log in with CalNet. Please try again.");
    }
  };

  const navigateRestaurant = () => navigation.navigate('RestaurantHome');
  const navigateOrg = () => navigation.navigate('OrgHome');

  return (
    <View style={styles.container}>
      {/* Animated Bubbles */}
      {bubbles.map((bubble, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bubble,
            {
              width: bubble.size,
              height: bubble.size,
              borderRadius: bubble.size / 2,
              transform: [{ translateX: bubble.x }, { translateY: bubble.y }],
            },
          ]}
        />
      ))}

      <View style={styles.overlay}>
        <Text style={styles.title}>Welcome to Savorly!</Text>
        <Text style={styles.subtitle}>Sign in as...</Text>

        {/* Student Button (with CalNet and Hover) */}
        <Animated.View style={[
            styles.buttonWrapper, 
            { transform: [{ scale: hoverAnimStudent }] }
        ]}>
            <Pressable
              style={styles.button}
              onPress={handleCalnetAuth} // <-- Calls the secure CalNet login flow
              onHoverIn={() => handleHoverIn(hoverAnimStudent)}
              onHoverOut={() => handleHoverOut(hoverAnimStudent)}
            >
              <Text style={styles.buttonText}>Student</Text>
            </Pressable>
        </Animated.View>

        {/* Restaurant Button (with Hover) */}
        <Animated.View style={[
            styles.buttonWrapper, 
            { transform: [{ scale: hoverAnimRestaurant }] }
        ]}>
            <Pressable
              style={styles.buttonAlt}
              onPress={navigateRestaurant}
              onHoverIn={() => handleHoverIn(hoverAnimRestaurant)}
              onHoverOut={() => handleHoverOut(hoverAnimRestaurant)}
            >
              <Text style={styles.buttonText}>Restaurant</Text>
            </Pressable>
        </Animated.View>

        {/* Campus Organization Button (with Hover) */}
        <Animated.View style={[
            styles.buttonWrapper, 
            { transform: [{ scale: hoverAnimOrg }] }
        ]}>
            <Pressable
              style={styles.buttonAlt2}
              onPress={navigateOrg}
              onHoverIn={() => handleHoverIn(hoverAnimOrg)}
              onHoverOut={() => handleHoverOut(hoverAnimOrg)}
            >
              <Text style={styles.buttonText}>Campus Organization</Text>
            </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const lightGreen = '#d6f5d6';
const gold = '#e8c75d';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightGreen,
  },
  overlay: {
    position: 'absolute',
    top: '20%',
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2a4d2a',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 22,
    marginBottom: 40,
    color: '#4d4d4d',
  },
  // NEW: A wrapper to hold the animated scale logic
  buttonWrapper: {
    width: '70%', 
    marginBottom: 20,
    // Shadow is applied here so it scales with the button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  
  // The actual button component (Pressable)
  button: {
    backgroundColor: gold,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonAlt: {
    backgroundColor: '#f2daa6',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonAlt2: {
    backgroundColor: '#eed29b',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3b3b3b',
  },
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
});