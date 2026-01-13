# Vendor Marketplace System Guide

## Overview
The CampusEats vendor marketplace system enables restaurants to manage and list surplus meals for students. This guide covers the vendor-side implementation including sign-up, menu management, and order tracking.

## Vendor Architecture

### Data Models

#### Vendors Collection (`/vendors/{vendorId}`)
```javascript
{
  userId: string,           // Firebase Auth UID
  name: string,             // Restaurant name
  email: string,            // Berkeley email
  category: string,         // e.g., "Restaurant", "Cafe", "Catering"
  address: string,          // Physical address
  phone: string,            // Contact number
  hours: {
    open: string,           // e.g., "09:00"
    close: string,          // e.g., "21:00"
  },
  description: string,      // Restaurant description
  ratings: {
    average: number,        // Average rating (0-5)
    count: number,          // Number of ratings
  },
  metrics: {
    total_revenue: number,  // Total revenue from sales
    meals_shared: number,   // Total meals listed
    orders_completed: number, // Orders fulfilled
  },
  isActive: boolean,        // Vendor account status
  createdAt: string,        // ISO timestamp
}
```

#### Menu Items Subcollection (`/vendors/{vendorId}/menuItems/{itemId}`)
```javascript
{
  name: string,             // Dish name
  description: string,      // Dish description
  price: number,            // Discount price
  originalPrice: number,    // Original price (for savings calculation)
  serves: number,           // Number of servings
  category: string,         // Optional: food category
  isAvailable: boolean,     // Availability status
  createdAt: string,        // ISO timestamp
}
```

#### Orders Collection (`/orders/{orderId}`)
```javascript
{
  studentId: string,        // Student's Firebase UID
  studentName: string,      // Student's display name
  studentEmail: string,     // Student's email
  vendorId: string,         // Vendor's Firebase UID
  vendorName: string,       // Restaurant name
  itemName: string,         // Item name
  itemPrice: number,        // Price paid
  servings: number,         // Number of servings
  orderStatus: string,      // "pending" | "ready" | "completed" | "cancelled"
  createdAt: string,        // Order timestamp
  pickupTime: string | null, // Pickup timestamp (set when order marked ready)
  notes: string,            // Special instructions
}
```

## Vendor Sign-Up Flow

### 1. Role Selection
Users select "Vendor" role during sign-up to access the vendor interface.

### 2. Vendor Information Collection
New vendors provide:
- Restaurant name *
- Category (Restaurant, Cafe, etc.)
- Address *
- Phone number *
- Berkeley email (@berkeley.edu) *
- Password *
- Description (optional)

### 3. Firestore Setup
Upon sign-up:
1. User document created in `/users/{userId}` with role: "vendor"
2. Vendor document created in `/vendors/{userId}`
3. Vendor metrics initialized with zero values

## Vendor Dashboard Screens

### Dashboard Tab (`VendorDashboardScreen`)
**Purpose**: Overview and quick actions for vendor

**Features**:
- Revenue tracking ($total_revenue)
- Meals shared count
- Orders completed count
- Quick action buttons:
  - Add menu item
  - View orders
  - Edit restaurant info

### Menu Tab (`VendorMenuScreen`)
**Purpose**: Manage menu items and pricing

**Features**:
- View all menu items with pricing
- Add new menu items (modal form)
- Edit existing items
- Delete items
- Real-time Firestore synchronization
- Required fields: Item name, discount price
- Optional fields: Description, original price, servings

**Add Item Modal**:
```
- Item Name (required)
- Description
- Discount Price (required)
- Original Price
- Serves (servings count)
```

### Orders Tab (`VendorOrdersScreen`)
**Purpose**: View and manage incoming student orders

**Features**:
- Real-time order list from Firestore
- Order details: Student name, item, price, servings
- Order status tracking (pending → ready → completed)
- Status change with single tap
- Order timestamp display
- Order count badge in header

**Order Statuses**:
- **Pending**: Order received, awaiting preparation
- **Ready**: Meal ready for pickup
- **Completed**: Student has picked up
- **Cancelled**: Order cancelled by vendor or student

### Profile Tab (`VendorProfileScreen`)
**Purpose**: View and manage vendor profile

**Features**:
- Display vendor information:
  - Restaurant name
  - Category
  - Address
  - Phone
  - Operating hours
- Sign out functionality

## Key Functions

### createMenuItem(vendorId, menuItem)
Creates a new menu item in vendor's menu.

```javascript
const result = await createMenuItem(userId, {
  name: 'Grilled Chicken Pasta',
  description: 'Fresh pasta with grilled chicken',
  price: 5.99,
  originalPrice: 12.99,
  serves: 2,
});
```

### updateMenuItem(vendorId, menuItemId, updates)
Updates an existing menu item.

```javascript
await updateMenuItem(vendorId, itemId, {
  price: 4.99,
  isAvailable: false,
});
```

### deleteMenuItem(vendorId, menuItemId)
Removes a menu item.

```javascript
await deleteMenuItem(vendorId, itemId);
```

### updateVendorMetrics(vendorId, revenue, mealsShared, ordersCompleted)
Updates vendor statistics when orders are placed.

```javascript
await updateVendorMetrics(vendorId, 5.99, 2, 1);
```

## Student Order Flow

### 1. Student Browsing
Students see vendor listings with menu items in the student app.

### 2. Reserve Item
When student taps reserve:
1. Order document created in `/orders` collection
2. Student metrics updated (money_saved, meals_rescued)
3. Vendor metrics updated (total_revenue, meals_shared)

### 3. Vendor Fulfillment
Vendor updates order status:
- **Pending** → **Ready** (meal is ready)
- **Ready** → **Completed** (student picked up)

### 4. Student Notification
Students receive order status updates (future: push notifications/email)

## Firestore Security Rules

### Vendors Collection Rules
```
- Public read access (students can see vendor profiles)
- Create: Only vendor can create their own profile
- Update: Only vendor can update their profile
- Delete: Disabled (vendors cannot delete profiles)

Menu Items (subcollection):
- Public read access
- Create/Update/Delete: Only vendor can manage their items
```

### Orders Collection Rules
```
- Read: Student can read their orders, vendor can read their restaurant's orders
- Create: Only authenticated students can create orders
- Update: Vendor can update order status, students can update order details
- Delete: Disabled (orders are permanent records)
```

## Integration Points

### Student App ↔ Vendor App
1. **Listings**: Vendor menu items displayed in student browse
2. **Orders**: Order creation links student purchases to vendor fulfillment
3. **Metrics**: Shared Firestore collections for real-time data

### Real-Time Updates
- Firestore real-time listeners sync data across apps
- Order status changes immediately visible to students
- Menu availability changes reflected instantly

## Best Practices

### For Vendors
1. Keep menu items up-to-date
2. Update order status promptly (helps students plan pickup)
3. Maintain accurate phone and address info
4. Use clear item descriptions for better conversions
5. Price items competitively for student appeal

### For Developers
1. Always validate vendor ownership before updates
2. Use Firestore transactions for atomic operations
3. Implement retry logic for network failures
4. Monitor security rules for access violations
5. Test both student and vendor flows

## Future Enhancements

### Phase 2 Features
- [ ] Real-time order notifications (push)
- [ ] Rating and review system
- [ ] Advanced analytics dashboard
- [ ] Bulk menu imports
- [ ] Scheduled meal listings
- [ ] Inventory management
- [ ] Revenue reports and payouts
- [ ] Promotional tools

### Phase 3 Features
- [ ] Multi-location support
- [ ] Staff management
- [ ] Mobile app for vendors (iOS/Android)
- [ ] QR code ordering
- [ ] Integration with POS systems

## Troubleshooting

### Orders Not Appearing
- Check vendor ID matches in Firestore
- Verify Firestore security rules
- Confirm Berkeley email validation passed

### Menu Items Not Saving
- Validate all required fields present
- Check Firestore quota and storage
- Verify vendor document exists

### Metrics Not Updating
- Confirm order was created successfully
- Check vendor metrics document exists
- Verify Firestore merge operations

## Contact & Support
For vendor support issues, contact the development team through the admin dashboard.
