# Migration Guide: From Mock Data to Real Data

This guide outlines the steps to transition your Savorly app from mock data to a fully functional app with real backend integration.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Backend Options](#backend-options)
3. [State Management](#state-management)
4. [API Integration](#api-integration)
5. [Data Persistence](#data-persistence)
6. [Authentication](#authentication)
7. [Step-by-Step Migration Plan](#step-by-step-migration-plan)

---

## Architecture Overview

### Current State
- All data is hardcoded in components
- No state management system
- No API calls
- No data persistence
- No authentication

### Target Architecture
```
┌─────────────────┐
│   React Native  │
│      App        │
└────────┬────────┘
         │
    ┌────▼────┐
    │  State  │
    │ Manager │
    └────┬────┘
         │
    ┌────▼────┐
    │   API   │
    │ Service │
    └────┬────┘
         │
    ┌────▼────┐
    │ Backend │
    │   API   │
    └─────────┘
```

---

## Backend Options

### Option 1: Firebase (Recommended for Quick Start)
**Pros:**
- Real-time database
- Authentication built-in
- File storage
- Easy to set up
- Free tier available

**Setup:**
```bash
npm install @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/auth
```

### Option 2: Supabase (Open Source Firebase Alternative)
**Pros:**
- PostgreSQL database
- Real-time subscriptions
- Authentication
- Storage
- Row-level security

**Setup:**
```bash
npm install @supabase/supabase-js
```

### Option 3: Custom Backend (Node.js/Express + PostgreSQL/MongoDB)
**Pros:**
- Full control
- Custom business logic
- Scalable

**Cons:**
- More setup required
- Need to handle hosting

### Option 4: AWS Amplify
**Pros:**
- Full-stack solution
- GraphQL API
- Authentication
- Storage

---

## State Management

### Recommended: React Context + Custom Hooks

Create a context provider for global state:

**File: `src/context/AppContext.js`**
```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load restaurants on mount
  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      const data = await fetchRestaurants();
      setRestaurants(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      restaurants,
      setRestaurants,
      loading,
      error,
      loadRestaurants,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
```

---

## API Integration

### Step 1: Create API Service Layer

**File: `src/services/api.js`**
```javascript
const API_BASE_URL = 'https://your-api.com/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Restaurant endpoints
  async getRestaurants(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/restaurants?${queryString}`);
  }

  async getRestaurantById(id) {
    return this.request(`/restaurants/${id}`);
  }

  async searchRestaurants(query) {
    return this.request(`/restaurants/search?q=${encodeURIComponent(query)}`);
  }

  async saveRestaurant(restaurantId) {
    return this.request(`/restaurants/${restaurantId}/save`, {
      method: 'POST',
    });
  }

  async claimDeal(dealId) {
    return this.request(`/deals/${dealId}/claim`, {
      method: 'POST',
    });
  }

  // Social endpoints
  async getFeedPosts() {
    return this.request('/social/feed');
  }

  async likePost(postId) {
    return this.request(`/social/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async commentOnPost(postId, comment) {
    return this.request(`/social/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  // User endpoints
  async getUserProfile() {
    return this.request('/user/profile');
  }

  async updateUserProfile(data) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Organization endpoints
  async getOrganizationEvents(orgId) {
    return this.request(`/organizations/${orgId}/events`);
  }
}

export default new ApiService();
```

### Step 2: Create Custom Hooks

**File: `src/hooks/useRestaurants.js`**
```javascript
import { useState, useEffect } from 'react';
import api from '../services/api';

export const useRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const data = await api.getRestaurants();
      setRestaurants(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { restaurants, loading, error, refetch: loadRestaurants };
};
```

---

## Data Persistence

### Option 1: AsyncStorage (Local Storage)
```bash
npm install @react-native-async-storage/async-storage
```

**File: `src/utils/storage.js`**
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async get(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  async set(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },

  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },
};
```

### Option 2: React Query (Recommended for API Caching)
```bash
npm install @tanstack/react-query
```

**File: `src/providers/QueryProvider.js`**
```javascript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

export const QueryProvider = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);
```

---

## Authentication

### Using Firebase Auth Example

**File: `src/services/auth.js`**
```javascript
import auth from '@react-native-firebase/auth';

export const authService = {
  async signIn(email, password) {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  },

  async signUp(email, password, userData) {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      // Save additional user data to Firestore
      await saveUserProfile(userCredential.user.uid, userData);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  },

  async signOut() {
    await auth().signOut();
  },

  getCurrentUser() {
    return auth().currentUser;
  },

  onAuthStateChanged(callback) {
    return auth().onAuthStateChanged(callback);
  },
};
```

---

## Step-by-Step Migration Plan

### Phase 1: Setup Infrastructure (Week 1)

1. **Choose Backend Solution**
   - Set up Firebase/Supabase account
   - Configure authentication
   - Set up database structure

2. **Install Dependencies**
   ```bash
   npm install @react-native-async-storage/async-storage
   npm install @tanstack/react-query
   # Or Firebase/Supabase packages
   ```

3. **Create Project Structure**
   ```
   src/
   ├── services/
   │   ├── api.js
   │   └── auth.js
   ├── hooks/
   │   ├── useRestaurants.js
   │   ├── useUser.js
   │   └── useSocialFeed.js
   ├── context/
   │   └── AppContext.js
   ├── utils/
   │   └── storage.js
   └── screens/
       └── (existing screens)
   ```

### Phase 2: Replace Mock Data (Week 2-3)

#### Step 1: MapScreen
**Before:**
```javascript
const nearbyRestaurants = [/* hardcoded data */];
```

**After:**
```javascript
import { useRestaurants } from '../hooks/useRestaurants';

function MapScreen() {
  const { restaurants, loading, error } = useRestaurants();
  // Use restaurants from API
}
```

#### Step 2: SearchScreen
**Before:**
```javascript
const allRestaurants = [/* hardcoded data */];
```

**After:**
```javascript
import { useSearchRestaurants } from '../hooks/useSearchRestaurants';

function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { restaurants, loading } = useSearchRestaurants(searchQuery);
}
```

#### Step 3: SocialsScreen
**Before:**
```javascript
const feedPosts = [/* hardcoded data */];
```

**After:**
```javascript
import { useSocialFeed } from '../hooks/useSocialFeed';

function SocialsScreen() {
  const { posts, loading, likePost, commentOnPost } = useSocialFeed();
}
```

#### Step 4: ProfileScreen
**Before:**
```javascript
const userData = {/* hardcoded data */};
```

**After:**
```javascript
import { useUser } from '../hooks/useUser';

function ProfileScreen() {
  const { user, loading, updateProfile } = useUser();
}
```

#### Step 5: RestaurantPage
**Before:**
```javascript
const restaurant = {/* hardcoded data */};
```

**After:**
```javascript
import { useRestaurant } from '../hooks/useRestaurant';

function RestaurantPage({ route }) {
  const { restaurantId } = route.params;
  const { restaurant, loading, saveRestaurant, claimDeal } = useRestaurant(restaurantId);
}
```

### Phase 3: Add Loading & Error States (Week 3)

Update all screens to handle loading and error states:

```javascript
function MapScreen() {
  const { restaurants, loading, error } = useRestaurants();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={refetch} />;
  }

  return (
    // Your existing UI
  );
}
```

### Phase 4: Add Real-time Updates (Week 4)

If using Firebase/Supabase, add real-time listeners:

```javascript
useEffect(() => {
  const unsubscribe = firestore()
    .collection('restaurants')
    .onSnapshot((snapshot) => {
      const restaurants = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRestaurants(restaurants);
    });

  return unsubscribe;
}, []);
```

### Phase 5: Add Offline Support (Week 5)

Implement offline-first approach with caching:

```javascript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['restaurants'],
  queryFn: api.getRestaurants,
  staleTime: 5 * 60 * 1000,
  cacheTime: 10 * 60 * 1000,
});
```

---

## Database Schema Examples

### Restaurants Collection
```javascript
{
  id: "restaurant_123",
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
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-15T00:00:00Z"
}
```

### Deals Collection
```javascript
{
  id: "deal_456",
  restaurantId: "restaurant_123",
  discount: 30,
  discountType: "percentage", // or "fixed"
  description: "30% off all sandwiches",
  startTime: "2024-01-15T10:00:00Z",
  endTime: "2024-01-15T18:00:00Z",
  claimedCount: 45,
  maxClaims: 100,
  isActive: true
}
```

### Users Collection
```javascript
{
  id: "user_789",
  email: "user@example.com",
  name: "Sarah Johnson",
  avatar: "https://...",
  savedRestaurants: ["restaurant_123", "restaurant_456"],
  dealsClaimed: 24,
  totalSavings: 156.50,
  createdAt: "2024-01-01T00:00:00Z"
}
```

### Posts Collection (Social Feed)
```javascript
{
  id: "post_101",
  userId: "user_789",
  restaurantId: "restaurant_123",
  content: "Just got an amazing deal!",
  imageUrl: "https://...",
  likes: 24,
  comments: 5,
  createdAt: "2024-01-15T10:00:00Z"
}
```

---

## Testing Strategy

### 1. Unit Tests
```bash
npm install --save-dev jest @testing-library/react-native
```

### 2. Integration Tests
Test API calls with mock data:
```javascript
jest.mock('../services/api');
```

### 3. E2E Tests
```bash
npm install --save-dev detox
```

---

## Deployment Checklist

- [ ] Set up production backend
- [ ] Configure environment variables
- [ ] Set up error tracking (Sentry)
- [ ] Set up analytics (Firebase Analytics/Mixpanel)
- [ ] Configure push notifications
- [ ] Set up CI/CD pipeline
- [ ] Test on real devices
- [ ] Performance optimization
- [ ] Security audit

---

## Quick Start: Firebase Example

### 1. Install Firebase
```bash
npm install @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/auth
```

### 2. Initialize Firebase
**File: `src/config/firebase.js`**
```javascript
import firebase from '@react-native-firebase/app';
import '@react-native-firebase/firestore';
import '@react-native-firebase/auth';

const firebaseConfig = {
  // Your config from Firebase console
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;
```

### 3. Create Firestore Service
**File: `src/services/firestore.js`**
```javascript
import firestore from '@react-native-firebase/firestore';

export const getRestaurants = async () => {
  const snapshot = await firestore().collection('restaurants').get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const getRestaurantById = async (id) => {
  const doc = await firestore().collection('restaurants').doc(id).get();
  return { id: doc.id, ...doc.data() };
};
```

---

## Resources

- [React Native Networking](https://reactnative.dev/docs/network)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [AsyncStorage Documentation](https://react-native-async-storage.github.io/async-storage/)

---

## Next Steps

1. Choose your backend solution
2. Set up authentication
3. Create API service layer
4. Replace mock data one screen at a time
5. Add loading and error states
6. Test thoroughly
7. Deploy!

Good luck with your migration! 🚀

