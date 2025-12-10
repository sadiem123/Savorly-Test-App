/**
 * Local Storage Service
 * Manages orders, favorites, and other user data in AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const ORDERS_STORAGE_KEY = '@savorly:orders';
const FAVORITES_STORAGE_KEY = '@savorly:favorites';

/**
 * Get all orders for a user
 */
export const getUserOrders = async (userId) => {
  try {
    const ordersData = await AsyncStorage.getItem(ORDERS_STORAGE_KEY);
    const allOrders = ordersData ? JSON.parse(ordersData) : [];
    return allOrders.filter(order => order.userId === userId);
  } catch (error) {
    console.error('Get user orders error:', error);
    return [];
  }
};

/**
 * Get current orders (pending, confirmed, preparing, ready)
 */
export const getCurrentOrders = async (userId) => {
  const orders = await getUserOrders(userId);
  return orders.filter(order => 
    ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)
  );
};

/**
 * Get past orders (completed)
 */
export const getPastOrders = async (userId) => {
  const orders = await getUserOrders(userId);
  return orders.filter(order => order.status === 'completed');
};

/**
 * Create a new order
 */
export const createOrder = async (orderData, userId) => {
  try {
    const ordersData = await AsyncStorage.getItem(ORDERS_STORAGE_KEY);
    const allOrders = ordersData ? JSON.parse(ordersData) : [];

    const newOrder = {
      id: `order_${Date.now()}`,
      ...orderData,
      userId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    allOrders.push(newOrder);
    await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(allOrders));

    return newOrder;
  } catch (error) {
    console.error('Create order error:', error);
    throw error;
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (orderId, status) => {
  try {
    const ordersData = await AsyncStorage.getItem(ORDERS_STORAGE_KEY);
    const allOrders = ordersData ? JSON.parse(ordersData) : [];

    const orderIndex = allOrders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      allOrders[orderIndex] = {
        ...allOrders[orderIndex],
        status,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(allOrders));
      return { success: true };
    }

    throw new Error('Order not found');
  } catch (error) {
    console.error('Update order status error:', error);
    throw error;
  }
};

/**
 * Get user's favorite restaurants
 */
export const getFavoriteRestaurants = async (userId) => {
  try {
    const favoritesData = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
    const allFavorites = favoritesData ? JSON.parse(favoritesData) : [];
    const userFavorites = allFavorites.filter(f => f.userId === userId);
    return userFavorites.map(f => f.restaurantId);
  } catch (error) {
    console.error('Get favorite restaurants error:', error);
    return [];
  }
};

/**
 * Add restaurant to favorites
 */
export const addFavoriteRestaurant = async (userId, restaurantId) => {
  try {
    const favoritesData = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
    const allFavorites = favoritesData ? JSON.parse(favoritesData) : [];

    // Check if already favorited
    const exists = allFavorites.some(
      f => f.userId === userId && f.restaurantId === restaurantId
    );

    if (!exists) {
      allFavorites.push({
        userId,
        restaurantId,
        createdAt: new Date().toISOString(),
      });
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(allFavorites));
    }

    return { success: true };
  } catch (error) {
    console.error('Add favorite restaurant error:', error);
    throw error;
  }
};

/**
 * Remove restaurant from favorites
 */
export const removeFavoriteRestaurant = async (userId, restaurantId) => {
  try {
    const favoritesData = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
    const allFavorites = favoritesData ? JSON.parse(favoritesData) : [];

    const filtered = allFavorites.filter(
      f => !(f.userId === userId && f.restaurantId === restaurantId)
    );

    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(filtered));
    return { success: true };
  } catch (error) {
    console.error('Remove favorite restaurant error:', error);
    throw error;
  }
};

