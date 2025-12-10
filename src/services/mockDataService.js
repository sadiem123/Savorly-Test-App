/**
 * Mock Data Service
 * Provides mock data when Firebase is not configured
 * This allows the app to function fully without backend
 */

// Mock restaurants
export const mockRestaurants = [
  {
    id: 'rest_1',
    name: 'Campus Cafe',
    category: 'Cafe',
    description: 'Fresh sandwiches, salads, and coffee. Perfect for students on the go!',
    address: '123 University Ave, Berkeley, CA 94720',
    phone: '(555) 123-4567',
    hours: 'Mon-Fri: 8am-8pm',
    location: {
      latitude: 37.8719,
      longitude: -122.2585,
    },
    rating: 4.5,
    totalReviews: 120,
    tags: ['Vegetarian', 'Healthy'],
    createdAt: new Date(),
  },
  {
    id: 'rest_2',
    name: 'Pizza Palace',
    category: 'Italian',
    description: 'Large pizzas, perfect for sharing with friends',
    address: '456 Telegraph Ave, Berkeley, CA 94704',
    phone: '(555) 234-5678',
    hours: 'Mon-Sun: 11am-11pm',
    location: {
      latitude: 37.8688,
      longitude: -122.2595,
    },
    rating: 4.8,
    totalReviews: 89,
    tags: ['Popular', 'Fast'],
    createdAt: new Date(),
  },
  {
    id: 'rest_3',
    name: 'Green Bowl',
    category: 'Healthy',
    description: 'Healthy bowls & smoothies made with fresh ingredients',
    address: '789 Shattuck Ave, Berkeley, CA 94704',
    phone: '(555) 345-6789',
    hours: 'Mon-Fri: 9am-7pm',
    location: {
      latitude: 37.8705,
      longitude: -122.2686,
    },
    rating: 4.6,
    totalReviews: 67,
    tags: ['Vegetarian', 'Vegan'],
    createdAt: new Date(),
  },
];

// Mock listings
export const mockListings = [
  {
    id: 'listing_1',
    restaurantId: 'rest_1',
    restaurant: 'Campus Cafe',
    name: 'Veggie Wrap',
    description: 'Fresh vegetables wrapped in a whole wheat tortilla with hummus and greens',
    price: 8.99,
    discountPrice: 6.29,
    category: 'Sandwiches',
    dietaryTags: ['Vegetarian', 'Gluten Free'],
    serves: 1,
    availableUntil: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'listing_2',
    restaurantId: 'rest_1',
    restaurant: 'Campus Cafe',
    name: 'Chicken Caesar Salad',
    description: 'Fresh romaine lettuce with grilled chicken, parmesan, and caesar dressing',
    price: 9.99,
    discountPrice: 6.99,
    category: 'Salads',
    dietaryTags: [],
    serves: 1,
    availableUntil: new Date(Date.now() + 3 * 60 * 60 * 1000),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'listing_3',
    restaurantId: 'rest_2',
    restaurant: 'Pizza Palace',
    name: 'Large Pizza',
    description: '18" pizza with your choice of toppings',
    price: 18.99,
    discountPrice: 9.50,
    category: 'Italian',
    dietaryTags: ['Vegetarian'],
    serves: 4,
    availableUntil: new Date(Date.now() + 1 * 60 * 60 * 1000),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'listing_4',
    restaurantId: 'rest_3',
    restaurant: 'Green Bowl',
    name: 'Acai Bowl',
    description: 'Fresh acai blended with banana, topped with granola and fresh fruit',
    price: 7.99,
    discountPrice: 5.59,
    category: 'Healthy',
    dietaryTags: ['Vegan', 'Gluten Free'],
    serves: 1,
    availableUntil: new Date(Date.now() + 4 * 60 * 60 * 1000),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'listing_5',
    restaurantId: 'rest_1',
    restaurant: 'Campus Cafe',
    name: 'Turkey Club',
    description: 'Roasted turkey with bacon, lettuce, tomato, and mayo on sourdough',
    price: 10.99,
    discountPrice: 7.69,
    category: 'Sandwiches',
    dietaryTags: [],
    serves: 1,
    availableUntil: new Date(Date.now() + 2.5 * 60 * 60 * 1000),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'listing_6',
    restaurantId: 'rest_2',
    restaurant: 'Pizza Palace',
    name: 'Margherita Pizza',
    description: 'Classic margherita with fresh mozzarella, basil, and tomato sauce',
    price: 16.99,
    discountPrice: 8.50,
    category: 'Italian',
    dietaryTags: ['Vegetarian'],
    serves: 2,
    availableUntil: new Date(Date.now() + 1.5 * 60 * 60 * 1000),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Helper to check if Firebase is configured
export const isFirebaseConfigured = () => {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  return apiKey && !apiKey.includes('YOUR_') && apiKey.length > 10;
};

// Mock data getters
export const getMockListings = () => {
  return Promise.resolve(mockListings.filter(l => l.isActive));
};

export const getMockListingById = (id) => {
  return Promise.resolve(mockListings.find(l => l.id === id) || null);
};

export const getMockRestaurants = () => {
  return Promise.resolve(mockRestaurants);
};

export const getMockRestaurantById = (id) => {
  return Promise.resolve(mockRestaurants.find(r => r.id === id) || null);
};

export const searchMockListings = (query, filters = {}) => {
  let results = [...mockListings.filter(l => l.isActive)];

  // Apply search query
  if (query) {
    const queryLower = query.toLowerCase();
    results = results.filter(listing =>
      listing.name?.toLowerCase().includes(queryLower) ||
      listing.restaurant?.toLowerCase().includes(queryLower) ||
      listing.description?.toLowerCase().includes(queryLower)
    );
  }

  // Apply filters
  if (filters.dietaryTags && filters.dietaryTags.length > 0) {
    results = results.filter(listing =>
      filters.dietaryTags.some(tag => listing.dietaryTags?.includes(tag))
    );
  }

  if (filters.servesMin) {
    results = results.filter(listing => listing.serves >= filters.servesMin);
  }

  return Promise.resolve(results);
};

