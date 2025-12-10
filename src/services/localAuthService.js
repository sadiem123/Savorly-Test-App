/**
 * Local Authentication Service
 * Uses AsyncStorage when Firebase is not configured
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_STORAGE_KEY = '@savorly:user';
const USERS_STORAGE_KEY = '@savorly:users';

// Mock users database (in real app, this would be in Firebase)
let mockUsers = [];

// Load users from storage on init
AsyncStorage.getItem(USERS_STORAGE_KEY).then(data => {
  if (data) {
    mockUsers = JSON.parse(data);
  }
});

/**
 * Sign up a new user
 */
export const signUp = async (email, password, userData) => {
  try {
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const newUser = {
      uid: `user_${Date.now()}`,
      email,
      name: userData.name || '',
      avatar: userData.avatar || '',
      role: userData.role || 'student',
      isSNAPRecipient: userData.isSNAPRecipient || false,
      year: userData.year || '',
      favoriteRestaurants: [],
      dealsClaimed: 0,
      totalSavings: 0,
      mealsRescued: 0,
      sustainabilityBadges: 0,
      createdAt: new Date().toISOString(),
    };

    // Save to mock database
    mockUsers.push(newUser);
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mockUsers));

    // Save current user
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));

    return newUser;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

/**
 * Sign in with email and password
 */
export const signIn = async (email, password) => {
  try {
    // Load users
    const usersData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    if (usersData) {
      mockUsers = JSON.parse(usersData);
    }

    // Find user
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      throw new Error('User not found. Please sign up first.');
    }

    // In a real app, we'd verify password here
    // For mock, we'll just check if user exists

    // Save current user
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

    return user;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

/**
 * Sign out current user
 */
export const signOut = async () => {
  try {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  try {
    const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

/**
 * Reset password (mock - just returns success)
 */
export const resetPassword = async (email) => {
  // In a real app, this would send a reset email
  // For mock, we'll just return success
  return Promise.resolve({ success: true });
};

/**
 * Subscribe to auth state changes (mock implementation)
 */
export const onAuthChange = (callback) => {
  // Check for existing user
  getCurrentUser().then(user => {
    callback(user);
  });

  // Return unsubscribe function (no-op for local storage)
  return () => {};
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    // Update in mock database
    const userIndex = mockUsers.findIndex(u => u.uid === userId);
    if (userIndex !== -1) {
      mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates };
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mockUsers));
    }

    // Update current user if it's the same
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.uid === userId) {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify({
        ...currentUser,
        ...updates,
      }));
    }

    return { success: true };
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
};

