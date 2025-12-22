# Firebase Quick Start Guide

This guide will help you set up Firebase and connect your Savorly app to real data in under 30 minutes.

## Prerequisites

- Firebase account (free tier available)
- Node.js installed
- Expo CLI installed

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: "Savorly"
4. Enable Google Analytics (optional)
5. Click "Create Project"

## Step 2: Add iOS/Android Apps

### For iOS:
1. Click iOS icon
2. Enter bundle ID: `com.savorly.app` (or your bundle ID)
3. Download `GoogleService-Info.plist`
4. Place it in `ios/` directory

### For Android:
1. Click Android icon
2. Enter package name: `com.savorly.app` (or your package name)
3. Download `google-services.json`
4. Place it in `android/app/` directory

## Step 3: Install Firebase Packages

```bash
npm install @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/auth @react-native-firebase/storage
```

For Expo managed workflow, you'll need to use `expo-firebase` instead:
```bash
npx expo install firebase
```

## Step 4: Initialize Firebase

**File: `src/config/firebase.js`**
```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// Get this from Firebase Console > Project Settings > Your apps
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
```

## Step 5: Set Up Firestore Database

1. Go to Firebase Console > Firestore Database
2. Click "Create Database"
3. Start in **test mode** (for development)
4. Choose location closest to your users
5. Click "Enable"

### Create Collections

Create these collections in Firestore:

#### 1. `restaurants` Collection
```javascript
// Document structure:
{
  name: "Campus Cafe",
  category: "Cafe",
  description: "Fresh sandwiches & salads",
  address: "123 University Ave",
  phone: "(555) 123-4567",
  hours: "Mon-Fri: 8am-8pm",
  location: {
    latitude: 40.7128,
    longitude: -74.0060
  },
  rating: 4.5,
  totalReviews: 120,
  tags: ["Vegetarian", "Healthy"],
  imageUrl: "https://...",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 2. `deals` Collection
```javascript
// Document structure:
{
  restaurantId: "restaurant_doc_id",
  discount: 30, // percentage
  discountType: "percentage",
  description: "30% off all sandwiches",
  startTime: Timestamp,
  endTime: Timestamp,
  claimedCount: 45,
  maxClaims: 100,
  isActive: true,
  createdAt: Timestamp
}
```

#### 3. `users` Collection
```javascript
// Document structure:
{
  email: "user@example.com",
  name: "Sarah Johnson",
  avatar: "https://...",
  savedRestaurants: ["restaurant_id_1", "restaurant_id_2"],
  dealsClaimed: 24,
  totalSavings: 156.50,
  createdAt: Timestamp
}
```

#### 4. `posts` Collection (Social Feed)
```javascript
// Document structure:
{
  userId: "user_doc_id",
  restaurantId: "restaurant_doc_id",
  content: "Just got an amazing deal!",
  imageUrl: "https://...",
  likes: 24,
  comments: 5,
  createdAt: Timestamp
}
```

## Step 6: Create Firebase Service Functions

**File: `src/services/firebaseService.js`**
```javascript
import { db, auth } from '../config/firebase';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';

// Restaurants
export const getRestaurants = async () => {
  const restaurantsRef = collection(db, 'restaurants');
  const snapshot = await getDocs(restaurantsRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const getRestaurantById = async (id) => {
  const docRef = doc(db, 'restaurants', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const getNearbyRestaurants = async (latitude, longitude, radiusKm = 5) => {
  // Note: Firestore doesn't support geospatial queries natively
  // You'll need to use a library like geofirestore or calculate client-side
  const restaurantsRef = collection(db, 'restaurants');
  const snapshot = await getDocs(restaurantsRef);
  
  return snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter(restaurant => {
      if (!restaurant.location) return false;
      const distance = calculateDistance(
        latitude,
        longitude,
        restaurant.location.latitude,
        restaurant.location.longitude
      );
      return distance <= radiusKm;
    });
};

// Deals
export const getActiveDeals = async () => {
  const dealsRef = collection(db, 'deals');
  const q = query(
    dealsRef,
    where('isActive', '==', true),
    where('endTime', '>', new Date()),
    orderBy('endTime'),
    limit(20)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const getDealsByRestaurant = async (restaurantId) => {
  const dealsRef = collection(db, 'deals');
  const q = query(
    dealsRef,
    where('restaurantId', '==', restaurantId),
    where('isActive', '==', true),
    orderBy('endTime')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const claimDeal = async (dealId, userId) => {
  const dealRef = doc(db, 'deals', dealId);
  const dealSnap = await getDoc(dealRef);
  
  if (!dealSnap.exists()) {
    throw new Error('Deal not found');
  }
  
  const deal = dealSnap.data();
  if (deal.claimedCount >= deal.maxClaims) {
    throw new Error('Deal has reached maximum claims');
  }
  
  // Update deal
  await updateDoc(dealRef, {
    claimedCount: deal.claimedCount + 1,
  });
  
  // Add to user's claimed deals
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();
  
  await updateDoc(userRef, {
    dealsClaimed: (userData.dealsClaimed || 0) + 1,
    totalSavings: (userData.totalSavings || 0) + calculateSavings(deal),
  });
  
  return { success: true };
};

// Social Feed
export const getFeedPosts = async (limitCount = 20) => {
  const postsRef = collection(db, 'posts');
  const q = query(
    postsRef,
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const likePost = async (postId, userId) => {
  const postRef = doc(db, 'posts', postId);
  const postSnap = await getDoc(postRef);
  const post = postSnap.data();
  
  const likedBy = post.likedBy || [];
  const isLiked = likedBy.includes(userId);
  
  if (isLiked) {
    await updateDoc(postRef, {
      likes: post.likes - 1,
      likedBy: likedBy.filter(id => id !== userId),
    });
  } else {
    await updateDoc(postRef, {
      likes: post.likes + 1,
      likedBy: [...likedBy, userId],
    });
  }
};

// User Profile
export const getUserProfile = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() };
  }
  return null;
};

export const saveRestaurant = async (userId, restaurantId) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();
  
  const savedRestaurants = userData.savedRestaurants || [];
  if (savedRestaurants.includes(restaurantId)) {
    // Remove if already saved
    await updateDoc(userRef, {
      savedRestaurants: savedRestaurants.filter(id => id !== restaurantId),
    });
    return { saved: false };
  } else {
    // Add to saved
    await updateDoc(userRef, {
      savedRestaurants: [...savedRestaurants, restaurantId],
    });
    return { saved: true };
  }
};

// Real-time listeners
export const subscribeToRestaurants = (callback) => {
  const restaurantsRef = collection(db, 'restaurants');
  return onSnapshot(restaurantsRef, (snapshot) => {
    const restaurants = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(restaurants);
  });
};

// Helper functions
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateSavings(deal) {
  // Calculate savings based on deal
  // This is a placeholder - implement based on your business logic
  return deal.discount * 0.1; // Example: 10% of discount
}
```

## Step 7: Update Your Components

**Example: Update MapScreen**

```javascript
import { useState, useEffect } from 'react';
import { getNearbyRestaurants, subscribeToRestaurants } from '../src/services/firebaseService';
import * as Location from 'expo-location';

function MapScreen() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurants();
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToRestaurants((updatedRestaurants) => {
      setRestaurants(updatedRestaurants);
    });

    return () => unsubscribe();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({});
      const nearby = await getNearbyRestaurants(
        location.coords.latitude,
        location.coords.longitude
      );
      setRestaurants(nearby);
    } catch (error) {
      console.error('Error loading restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  // Rest of your component...
}
```

## Step 8: Set Up Authentication

**File: `src/services/authService.js`**
```javascript
import { auth } from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const signUp = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email,
      name: userData.name,
      avatar: userData.avatar || '',
      savedRestaurants: [],
      dealsClaimed: 0,
      totalSavings: 0,
      createdAt: new Date(),
    });

    return user;
  } catch (error) {
    throw error;
  }
};

export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
```

## Step 9: Add Sample Data (Optional)

Create a script to populate Firestore with sample data:

**File: `scripts/seedData.js`**
```javascript
import { db } from '../src/config/firebase';
import { collection, addDoc } from 'firebase/firestore';

const seedRestaurants = async () => {
  const restaurants = [
    {
      name: 'Campus Cafe',
      category: 'Cafe',
      description: 'Fresh sandwiches & salads',
      address: '123 University Ave',
      phone: '(555) 123-4567',
      hours: 'Mon-Fri: 8am-8pm',
      location: { latitude: 40.7128, longitude: -74.0060 },
      rating: 4.5,
      totalReviews: 120,
      tags: ['Vegetarian', 'Healthy'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Add more restaurants...
  ];

  for (const restaurant of restaurants) {
    await addDoc(collection(db, 'restaurants'), restaurant);
    console.log(`Added: ${restaurant.name}`);
  }
};

seedRestaurants();
```

## Step 10: Security Rules

Update Firestore security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Restaurants: Read-only for all, write for admins
    match /restaurants/{restaurantId} {
      allow read: if true;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Deals: Read for all, write for restaurants
    match /deals/{dealId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Users: Read own data, write own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Posts: Read for all, write for authenticated users
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Testing

1. **Test Authentication:**
   ```javascript
   import { signUp, signIn } from './src/services/authService';
   
   // Test sign up
   await signUp('test@example.com', 'password123', { name: 'Test User' });
   
   // Test sign in
   await signIn('test@example.com', 'password123');
   ```

2. **Test Data Fetching:**
   ```javascript
   import { getRestaurants } from './src/services/firebaseService';
   
   const restaurants = await getRestaurants();
   console.log('Restaurants:', restaurants);
   ```

## Next Steps

1. ✅ Set up Firebase project
2. ✅ Install packages
3. ✅ Create Firestore collections
4. ✅ Create service functions
5. ✅ Update components to use Firebase
6. ⏭️ Add authentication UI
7. ⏭️ Add error handling
8. ⏭️ Add loading states
9. ⏭️ Deploy to production

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

**You're all set!** Your app is now connected to Firebase. Start replacing mock data with Firebase calls one screen at a time.

