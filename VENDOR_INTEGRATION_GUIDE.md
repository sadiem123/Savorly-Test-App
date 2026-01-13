# Vendor Marketplace - Integration & Deployment Guide

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CampusEats Marketplace                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────┐  ┌─────────────────────────────┐ │
│  │   Student Side             │  │   Vendor Side               │ │
│  ├────────────────────────────┤  ├─────────────────────────────┤ │
│  │ • Browse Listings          │  │ • Dashboard                 │ │
│  │ • View Vendors             │  │ • Menu Management           │ │
│  │ • Reserve Items            │  │ • Order Management          │ │
│  │ • Track Orders             │  │ • Profile Settings          │ │
│  │ • View Metrics             │  │ • View Metrics              │ │
│  │ • Message Vendors          │  │ • Respond to Students       │ │
│  │                            │  │                             │ │
│  └────────────────────────────┘  └─────────────────────────────┘ │
│           ▲                                     ▲                 │
│           │         Firestore Events           │                 │
│           └─────────────────────────────────────┘                │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Firebase Realtime Database                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │ │
│  │  │   /users     │  │  /vendors    │  │  /orders     │      │ │
│  │  │              │  │              │  │              │      │ │
│  │  │ Student &    │  │ Vendor       │  │ Order        │      │ │
│  │  │ Vendor       │  │ Profiles &   │  │ Records &    │      │ │
│  │  │ Profiles     │  │ Menu Items   │  │ Status       │      │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │ │
│  │                                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │          Firebase Authentication (Berkeley Email)           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Vendor Sign-Up Flow
```
Vendor Registration
        │
        ▼
┌───────────────────────────────┐
│  Role Selection: "Vendor"     │
└───────────────────────────────┘
        │
        ▼
┌───────────────────────────────┐
│  Collect Vendor Details       │
│  • Restaurant name            │
│  • Category                   │
│  • Address, Phone             │
│  • Berkeley Email             │
│  • Password                   │
└───────────────────────────────┘
        │
        ▼
┌───────────────────────────────┐
│  Create User Document         │
│  /users/{vendorId}            │
│  role: "vendor"               │
└───────────────────────────────┘
        │
        ▼
┌───────────────────────────────┐
│  Create Vendor Document       │
│  /vendors/{vendorId}          │
│  Initialize metrics: 0,0,0    │
└───────────────────────────────┘
        │
        ▼
┌───────────────────────────────┐
│  Access Vendor Dashboard      │
│  Ready to add menu items      │
└───────────────────────────────┘
```

### Order Transaction Flow
```
Student Reserves Item
        │
        ▼
┌───────────────────────────────────────────┐
│  Create Order Document                    │
│  /orders/{orderId}                        │
│  ├─ studentId, studentName, email        │
│  ├─ vendorId, vendorName                 │
│  ├─ itemName, itemPrice, servings        │
│  ├─ orderStatus: "pending"               │
│  └─ createdAt: timestamp                 │
└───────────────────────────────────────────┘
        │
        ├─────────────────────────────┐
        │                             │
        ▼                             ▼
┌──────────────────────────┐ ┌──────────────────────────┐
│ Update Student Metrics   │ │ Update Vendor Metrics    │
│                          │ │                          │
│ money_saved += price     │ │ total_revenue += price   │
│ meals_rescued += serves  │ │ meals_shared += serves   │
│                          │ │ (orders_completed += 1)  │
└──────────────────────────┘ └──────────────────────────┘
        │                             │
        ▼                             ▼
┌──────────────────────────────────────────────────────┐
│  Vendor Sees New Pending Order                       │
│  Updates status: pending → ready → completed         │
└──────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────┐
│  Student Sees Order Status Updates                   │
│  Receives notification (future)                      │
└──────────────────────────────────────────────────────┘
```

### Menu Item Management Flow
```
Vendor Creates Menu Item
        │
        ▼
┌────────────────────────────────┐
│  Open "Add Item" Modal         │
│  Fill in:                      │
│  • Item Name (required)        │
│  • Description                 │
│  • Discount Price (required)   │
│  • Original Price              │
│  • Servings                    │
└────────────────────────────────┘
        │
        ▼
┌────────────────────────────────┐
│  createMenuItem()              │
│  → Firestore                   │
│  /vendors/{vendorId}/          │
│    menuItems/{newId}           │
└────────────────────────────────┘
        │
        ▼
┌────────────────────────────────┐
│  Real-Time Sync                │
│  • Student app fetches         │
│  • Menu displays item          │
│  • Available for purchase      │
└────────────────────────────────┘
        │
        ▼
┌────────────────────────────────┐
│  Vendor Can Update/Delete      │
│  • Edit pricing                │
│  • Remove unavailable items    │
│  • Changes sync immediately    │
└────────────────────────────────┘
```

## Firestore Query Examples

### Fetch All Menu Items for Vendor
```javascript
const itemsCollection = collection(db, 'vendors', vendorId, 'menuItems');
const itemsSnap = await getDocs(itemsCollection);
const items = [];
itemsSnap.forEach(doc => {
  items.push({ id: doc.id, ...doc.data() });
});
```

### Fetch All Orders for Vendor
```javascript
const ordersCollection = collection(db, 'orders');
const ordersQuery = query(
  ordersCollection,
  where('vendorId', '==', vendorId),
  orderBy('createdAt', 'desc')
);
const ordersSnap = await getDocs(ordersQuery);
```

### Fetch Student's Orders
```javascript
const ordersCollection = collection(db, 'orders');
const studentOrdersQuery = query(
  ordersCollection,
  where('studentId', '==', studentId)
);
const studentOrdersSnap = await getDocs(studentOrdersQuery);
```

### Real-Time Listener for Orders
```javascript
const unsubscribe = onSnapshot(
  query(collection(db, 'orders'), where('vendorId', '==', vendorId)),
  (snapshot) => {
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    setOrders(orders); // Update UI in real-time
  }
);
```

## Security Implementation

### Firestore Security Rules Structure

```
/users Collection
├── Read: All authenticated users
├── Create: Only self, enforce role
├── Update: Only self, cannot change role
└── Delete: Only self

/vendors Collection
├── Read: Public (students can browse)
├── Create: Only vendor owner
├── Update: Only vendor owner
├── Delete: Disabled

/vendors/{vendorId}/menuItems Subcollection
├── Read: Public
├── Create: Only vendor owner
├── Update: Only vendor owner
└── Delete: Only vendor owner

/orders Collection
├── Read: Student/Vendor can see own orders
├── Create: Only students
├── Update: Vendor can update status
└── Delete: Disabled (audit trail)
```

### Berkeley Email Validation
```javascript
function isBerkeleyEmail(email) {
  return email.matches("^.*@berkeley\\.edu$");
}

// Applied to both student and vendor sign-ups
```

## Performance Optimization

### Indexes Recommended (Firestore Console)

```
Collection: orders
Composite Index:
  - vendorId (Ascending)
  - createdAt (Descending)

Collection: orders
Composite Index:
  - studentId (Ascending)
  - createdAt (Descending)
```

### Query Optimization
- Always filter by vendorId/studentId first
- Order by createdAt for chronological order
- Limit results for pagination (future)
- Use subcollections for menu items (better organization)

## Monitoring & Analytics

### Key Metrics to Track
1. **Vendor Engagement**
   - Vendors with active listings
   - Average items per vendor
   - Menu update frequency

2. **Order Metrics**
   - Orders per vendor per day
   - Average order value
   - Order fulfillment time

3. **Revenue Tracking**
   - Total revenue per vendor
   - Revenue trends over time
   - Top-selling vendors

4. **User Metrics**
   - Money saved per student
   - Meals rescued count
   - Student purchase frequency

### Firestore Usage Monitoring
- Document read/write counts
- Query performance
- Storage usage by collection
- Index efficiency

## Deployment Checklist

### Pre-Deployment
- [ ] Test vendor sign-up flow
- [ ] Test menu item CRUD operations
- [ ] Test order creation and status updates
- [ ] Verify Firestore security rules
- [ ] Test real-time sync
- [ ] Verify metrics calculations
- [ ] Test error handling
- [ ] Check for memory leaks
- [ ] Test on different devices

### Production Deployment
- [ ] Deploy to Firebase
- [ ] Verify Firestore rules are published
- [ ] Monitor Firestore metrics
- [ ] Set up error logging (Sentry/Firebase Crashlytics)
- [ ] Enable analytics
- [ ] Configure email notifications
- [ ] Set up vendor support channel

### Post-Deployment
- [ ] Monitor Firestore quotas
- [ ] Check error rates
- [ ] Verify real-time sync working
- [ ] Get vendor feedback
- [ ] Monitor performance metrics
- [ ] Plan scaling strategy

## Scaling Considerations

### Firestore Scalability
- Current structure supports 10,000+ vendors
- Real-time listeners scale well with Firestore
- Consider pagination for large order lists
- Implement caching for frequently accessed vendors

### Database Optimization
- Archive old orders (6+ months)
- Index frequently queried fields
- Distribute writes across regions (future)
- Consider Firestore backup strategy

### Load Testing
- Simulate 100+ concurrent vendors
- Simulate 1000+ concurrent students
- Monitor Firestore under load
- Benchmark query performance

## Migration Path (if from different backend)

### Phase 1: Prepare
1. Export existing vendor data
2. Map to new Firestore schema
3. Backup current database

### Phase 2: Migrate
1. Create vendors collection documents
2. Create orders collection documents
3. Validate data integrity

### Phase 3: Sync
1. Test new interface with data
2. Parallel run old and new
3. Monitor for discrepancies

### Phase 4: Cutover
1. Switch to new system
2. Monitor closely
3. Keep old system accessible for rollback

## Troubleshooting Guide

### Common Issues & Solutions

**Orders Not Appearing for Vendor**
- Check vendorId matches in order document
- Verify Firestore read rules allow access
- Check browser console for query errors

**Menu Items Not Updating**
- Verify menu item document exists in Firestore
- Check update function was called
- Monitor Firestore write operations

**Real-Time Sync Delayed**
- Check network connection
- Verify Firestore is active
- Check listener is properly attached
- Monitor Firestore latency

**Metrics Not Updating**
- Verify order was created successfully
- Check vendor document exists
- Confirm metrics field structure
- Check for permission errors

**Berkeley Email Validation Failing**
- Ensure email ends with @berkeley.edu
- Check regex rule in Firestore
- Verify email in sign-up form

## API References

### Vendor Functions
```javascript
// Create menu item
await createMenuItem(vendorId, menuItem)

// Update menu item
await updateMenuItem(vendorId, menuItemId, updates)

// Delete menu item
await deleteMenuItem(vendorId, menuItemId)

// Update vendor metrics
await updateVendorMetrics(vendorId, revenue, meals, orders)
```

### Related Student Functions
```javascript
// Update student metrics (existing)
await updateUserMetrics(studentId, amountSpent, servings)
```

## Support & Maintenance

### Regular Maintenance Tasks
- Weekly: Check Firestore quotas
- Monthly: Review vendor performance
- Quarterly: Audit security rules
- Annually: Archive old data

### Support Contacts
- Developer: For technical issues
- Admin: For vendor account issues
- Analytics: For business metrics

## Related Documentation
- See `VENDOR_GUIDE.md` for detailed features
- See `VENDOR_IMPLEMENTATION.md` for implementation details
- See `firestore.rules` for security rules
- See `App.js` for source code

---

**Version**: 1.0
**Last Updated**: January 2026
**Status**: Production Ready
