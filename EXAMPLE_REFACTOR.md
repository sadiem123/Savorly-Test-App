# Example Refactor: MapScreen with Real Data

This document shows a concrete example of how to refactor MapScreen from mock data to real API data.

## Before: Mock Data Version

```javascript
function MapScreen() {
  const navigation = useNavigation();
  
  // Sample restaurant data - HARDCODED
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
    // ... more hardcoded data
  ];

  return (
    <View style={styles.mapScreenContainer}>
      {/* UI code */}
    </View>
  );
}
```

## After: Real Data Version

### Step 1: Create API Service

**File: `src/services/api.js`**
```javascript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api'  // Development
  : 'https://api.savorly.com/api'; // Production

class ApiService {
  async get(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async getNearbyRestaurants(latitude, longitude, radius = 5) {
    return this.get(
      `/restaurants/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`
    );
  }
}

export default new ApiService();
```

### Step 2: Create Custom Hook

**File: `src/hooks/useNearbyRestaurants.js`**
```javascript
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import api from '../services/api';

export const useNearbyRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    loadLocationAndRestaurants();
  }, []);

  const loadLocationAndRestaurants = async () => {
    try {
      setLoading(true);
      
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      setLocation({ latitude, longitude });

      // Fetch nearby restaurants
      const data = await api.getNearbyRestaurants(latitude, longitude);
      setRestaurants(data.restaurants || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error loading restaurants:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    loadLocationAndRestaurants();
  };

  return {
    restaurants,
    loading,
    error,
    location,
    refetch,
  };
};
```

### Step 3: Update MapScreen Component

**File: `App.js` (Updated MapScreen)**
```javascript
import { useNearbyRestaurants } from './src/hooks/useNearbyRestaurants';
import { ActivityIndicator } from 'react-native';

function MapScreen() {
  const navigation = useNavigation();
  const { restaurants, loading, error, refetch } = useNearbyRestaurants();

  // Show loading state
  if (loading) {
    return (
      <View style={styles.mapScreenContainer}>
        <View style={styles.header}>
          <Text style={styles.mapTitle}>Nearby Deals</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>Loading restaurants...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.mapScreenContainer}>
        <View style={styles.header}>
          <Text style={styles.mapTitle}>Nearby Deals</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={refetch}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show empty state
  if (restaurants.length === 0) {
    return (
      <View style={styles.mapScreenContainer}>
        <View style={styles.header}>
          <Text style={styles.mapTitle}>Nearby Deals</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No restaurants found nearby</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={refetch}
          >
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render restaurants
  return (
    <View style={styles.mapScreenContainer}>
      {/* Header */}
      <View style={styles.mapHeader}>
        <Text style={styles.mapTitle}>Nearby Deals</Text>
        <Text style={styles.mapSubtitle}>
          {restaurants.length} {restaurants.length === 1 ? 'deal' : 'deals'} near you
        </Text>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        {/* Map component would go here */}
      </View>

      {/* Restaurant List */}
      <ScrollView style={styles.restaurantList} showsVerticalScrollIndicator={false}>
        {restaurants.map((restaurant) => (
          <TouchableOpacity
            key={restaurant.id}
            style={styles.restaurantCard}
            onPress={() => navigation.navigate('RestaurantPage', { restaurantId: restaurant.id })}
          >
            <View style={styles.restaurantCardHeader}>
              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
                <Text style={styles.restaurantCategory}>{restaurant.category}</Text>
              </View>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  {restaurant.currentDeal?.discount || 'No deal'}
                </Text>
              </View>
            </View>
            <Text style={styles.restaurantDescription}>{restaurant.description}</Text>
            <View style={styles.restaurantFooter}>
              <Text style={styles.restaurantDistance}>
                📍 {calculateDistance(restaurant.location)} mi
              </Text>
              <Text style={styles.timeLeft}>
                ⏰ {formatTimeLeft(restaurant.currentDeal?.endTime)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// Helper functions
function calculateDistance(restaurantLocation) {
  // Calculate distance using Haversine formula or use a library
  // For now, return formatted distance
  return restaurantLocation?.distance?.toFixed(1) || '0.0';
}

function formatTimeLeft(endTime) {
  if (!endTime) return 'No active deal';
  
  const now = new Date();
  const end = new Date(endTime);
  const diff = end - now;
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}
```

### Step 4: Add Required Dependencies

```bash
npm install expo-location
```

### Step 5: Add Loading/Error Styles

Add these styles to your StyleSheet:

```javascript
loadingContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 40,
},
loadingText: {
  marginTop: 16,
  fontSize: 16,
  color: '#666',
},
errorContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 40,
},
errorText: {
  fontSize: 16,
  color: '#d32f2f',
  marginBottom: 20,
  textAlign: 'center',
},
retryButton: {
  backgroundColor: '#2e7d32',
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 8,
},
retryButtonText: {
  color: '#fff',
  fontWeight: '600',
},
emptyContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 40,
},
emptyText: {
  fontSize: 16,
  color: '#666',
  marginBottom: 20,
},
```

## Key Changes Summary

1. ✅ **Removed hardcoded data** - Data now comes from API
2. ✅ **Added loading state** - Shows spinner while fetching
3. ✅ **Added error handling** - Shows error message with retry option
4. ✅ **Added empty state** - Handles case when no restaurants found
5. ✅ **Location-based** - Uses real user location
6. ✅ **Dynamic data** - Restaurant list updates based on API response
7. ✅ **Navigation params** - Passes restaurant ID instead of hardcoded data

## Testing the Refactored Screen

### 1. Mock API Response (Development)
```javascript
// In api.js, for development:
if (__DEV__) {
  // Return mock data
  return Promise.resolve({
    restaurants: [
      {
        id: 1,
        name: 'Campus Cafe',
        // ... mock data
      }
    ]
  });
}
```

### 2. Test Loading State
- Temporarily add delay in API call
- Verify loading spinner appears

### 3. Test Error State
- Disconnect from network
- Verify error message appears

### 4. Test Empty State
- Mock empty API response
- Verify empty state message

## Next Steps

1. Apply same pattern to SearchScreen
2. Apply same pattern to SocialsScreen
3. Apply same pattern to ProfileScreen
4. Apply same pattern to RestaurantPage
5. Add caching for offline support
6. Add pull-to-refresh functionality

