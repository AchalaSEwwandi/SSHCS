import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import DeliveryAssignment from '../models/DeliveryAssignment.js';
import DeliveryPerson from '../models/DeliveryPerson.js';
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';
import { analyzeSentiment } from '../utils/index.js';

/**
 * POST /api/orders
 * Create a new order
 */
export const createOrder = async (req, res, next) => {
  try {
    const { shopId, shopName, items, deliveryAddress, studentId } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Session key from header (for demo) - will be replaced with userId from auth later
    const sessionKey = studentId || req.headers['x-session-key'] || 'demo';

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryCharge = 50;
    const grandTotal = totalAmount + deliveryCharge;

    const order = new Order({
      studentId: sessionKey,
      shop: shopId || null,
      shopName: shopName || shopId || 'Campus Shop',
      items: items.map((i) => ({
        product: i.product || null,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      totalAmount,
      deliveryCharge,
      grandTotal,
      deliveryAddress: deliveryAddress || 'Campus',
      status: 'Pending',
    });

    await order.save();
    res.status(201).json({ success: true, message: 'Order created successfully', data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/history
 * Get order history for current user/session
 */
export const getOrderHistory = async (req, res, next) => {
  try {
    const sessionKey = req.headers['x-session-key'];

    let query = {};
    
    // If the user includes a role in the query or header, bypass student filtering if they are admin/vendor
    const userRole = req.user?.role;
    
    if (userRole === 'shop_owner' || userRole === 'admin' || userRole === 'delivery_person') {
      // Vendors/Admins/Delivery can view all orders (filtered on frontend or advanced query later)
    } else if (sessionKey && sessionKey !== 'demo') {
      query = { studentId: sessionKey };
    } else if (req.user && req.user.role === 'student') {
      query = { studentId: req.user.id.toString() }; // The JWT token payload has `id`, not `_id` typically
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    // Fetch assignments to include delivery info
    const orderIds = orders.map(o => o._id);
    const assignments = await DeliveryAssignment.find({ order: { $in: orderIds } }).lean();

    const ordersWithAssignments = orders.map(order => {
      const assignment = assignments.find(a => a.order.toString() === order._id.toString());
      return { ...order, deliveryAssignment: assignment || null };
    });

    res.json({ success: true, count: ordersWithAssignments.length, data: ordersWithAssignments });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:orderId/payment
 * Calculate payment details for an order
 */
export const calculatePayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      data: {
        itemTotal: order.totalAmount,
        deliveryCharge: order.deliveryCharge,
        grandTotal: order.grandTotal,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/pay
 * Process payment for an order (mock/stub for demo)
 */
export const processPayment = async (req, res, next) => {
  try {
    const { orderId, cardType, nameOnCard, cardNumber, expiryDate, cvv } = req.body;

    if (!cardType || !nameOnCard || !cardNumber || !expiryDate || !cvv) {
      return res.status(400).json({ success: false, message: 'All payment fields are required' });
    }
    if (cardNumber.replace(/\s/g, '').length !== 16) {
      return res.status(400).json({ success: false, message: 'Card number must be 16 digits' });
    }
    if (cvv.length !== 3) {
      return res.status(400).json({ success: false, message: 'CVV must be 3 digits' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const payment = new Payment({
      order: orderId,
      amount: order.grandTotal,
      cardType,
      nameOnCard,
      lastFourDigits: cardNumber.replace(/\s/g, '').slice(-4),
      status: 'Success',
    });

    await payment.save();

// Keep order as Pending so Vendor can explicitly Accept it, but reduce stock immediately to reserve it.
      for (const item of order.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } }).catch(() => {});
        }
      }

      res.json({ success: true, message: 'Payment successful, awaiting vendor acceptance.', data: payment });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/assign-delivery
 * Auto-assign a delivery person to an order
 */
export const assignDelivery = async (req, res, next) => {
  try {
    const { orderId, storeName } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if already assigned
    const existing = await DeliveryAssignment.findOne({ order: orderId, status: { $ne: 'Rejected' } });
    if (existing) {
      return res.json({
        success: true,
        message: 'Delivery already assigned',
        data: { deliveryPersonName: existing.deliveryPersonName, assignment: existing },
      });
    }

    // Build the query to check storeName (could match order's shopName or the given vendor storeName)
    const storeNamesToCheck = [order.shopName];
    if (storeName && storeName !== order.shopName) {
      storeNamesToCheck.push(storeName);
    }

    // Find an available delivery person for this store (Randomly)
    const availableDps = await DeliveryPerson.aggregate([
      { $match: { 
          storeName: { $in: storeNamesToCheck },
          availability: 'Available' 
        } 
      },
      { $sample: { size: 1 } }
    ]);

    if (!availableDps || availableDps.length === 0) {
      return res.status(200).json({
        success: false,
        assigned: false,
        message: `No delivery person available for ${order.shopName}. Please try again later.`,
      });
    }

    // Do NOT mark as busy here. Wait for Delivery Person to accept it via their dashboard.
    // dp.availability = 'Busy';
    // await dp.save();

    const dp = availableDps[0];
    
    const assignment = new DeliveryAssignment({
      order: orderId,
      deliveryPerson: dp._id,
      deliveryPersonName: dp.fullName,
      deliveryPersonPhone: dp.phone,
      vehicleType: dp.vehicleType,
      vehicleNumber: dp.vehicleNumber,
    });

    await assignment.save();

    order.status = 'Processing';
    await order.save();

    res.json({
      success: true,
      assigned: true,
      message: 'Delivery person assigned successfully',
      data: { deliveryPersonName: dp.fullName, assignment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/tracking/:orderId
 * Get order tracking information
 */
export const getOrderTracking = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate('shop', 'name');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const assignment = await DeliveryAssignment.findOne({ order: orderId });

    // Robust shopId/shopName extraction
    let shopId = null;
    let shopName = '';
    if (order.shop && typeof order.shop === 'object') {
      shopId = order.shop._id;
      shopName = order.shop.name || order.shopName || '';
    } else if (order.shop) {
      shopId = order.shop;
      shopName = order.shopName || '';
    } else {
      shopName = order.shopName || '';
    }

    // Fallback: if shopId is still null but shopName exists, look up Shop by name
    if (!shopId && shopName) {
      const shopLookup = await Shop.findOne({
        $or: [
          { shopName: shopName },
          { name: shopName },
          { shopName: { $regex: new RegExp(`^${shopName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        ],
      }).lean();
      if (shopLookup) {
        shopId = shopLookup._id;
        shopName = shopLookup.shopName || shopLookup.name || shopName;
      }
    }

    res.json({
      success: true,
      data: {
        orderId: order._id,
        status: order.status,
        shopId,
        shopName,
        grandTotal: order.grandTotal,
        deliveryPersonName: assignment ? assignment.deliveryPersonName : 'Waiting for assignment…',
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/orders/:orderId/status
 * Update order status
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const validStatuses = ['Pending', 'Processing', 'Accepted', 'Ready for Pickup', 'Out for Delivery', 'Delivered'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    let optionalMessage = '';
    
    // Auto-assign delivery person if marking as Processing
    if (status === 'Processing') {
      const existing = await DeliveryAssignment.findOne({ order: orderId, status: { $ne: 'Rejected' } });
      if (!existing) {
        // Find random available
        const availableDps = await DeliveryPerson.aggregate([
          { $match: { 
              storeName: { $in: [order.shopName] },
              availability: 'Available' 
            } 
          },
          { $sample: { size: 1 } }
        ]);
        
        if (availableDps.length > 0) {
          const dpData = availableDps[0];
          const assignment = new DeliveryAssignment({
            order: orderId,
            deliveryPerson: dpData._id,
            deliveryPersonName: dpData.fullName,
            deliveryPersonPhone: dpData.phone,
            vehicleType: dpData.vehicleType,
            vehicleNumber: dpData.vehicleNumber,
          });
          await assignment.save();
          optionalMessage = ` and successfully routed to rider: ${dpData.fullName}`;
        }
      }
    }

    // Pass the populated order back implicitly if possible later, for now we return bare success response
    res.json({ success: true, message: `Status updated${optionalMessage}`, data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/:orderId/confirm-delivery
 * Confirm delivery completion
 */
export const confirmDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: 'Delivered', isDeliveryConfirmed: true },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Free up the delivery person
    const assignment = await DeliveryAssignment.findOne({ order: orderId });
    if (assignment && assignment.deliveryPerson) {
      await DeliveryPerson.findByIdAndUpdate(assignment.deliveryPerson, { availability: 'Available' }).catch(() => {});
    }

    res.json({ success: true, message: 'Delivery confirmed!', data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/:orderId/rate
 * Submit rating for delivery
 */
export const submitRating = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { stars, comment } = req.body;

    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Find delivery assignment
    const assignment = await DeliveryAssignment.findOne({ order: orderId });
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'No delivery person assigned to this order' });
    }

    // Check if already rated
    const existingRating = await Payment.findOne({ order: orderId }); // Using Payment as placeholder for rating
    if (existingRating) {
      return res.status(400).json({ success: false, message: 'Order already rated' });
    }

    const rating = new Payment({
      order: orderId,
      amount: 0, // Not used for rating
      cardType: 'Visa', // placeholder
      nameOnCard: 'Rater',
      lastFourDigits: '0000',
      status: 'Success',
    });

    await rating.save();

    // Mark order as rated
    order.isRated = true;
    await order.save();

    res.json({ success: true, message: 'Rating submitted!', data: rating });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/:orderId/save-delivery-details
 * Save delivery address and contact details
 */
export const saveDeliveryAddress = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { deliveryArea, deliveryAddress, telephone, email, confirmedOrder } = req.body;

    // Validations
    const validAreas = ['Inside Campus', 'Outside Campus (around 1km)'];
    if (!deliveryArea || !validAreas.includes(deliveryArea)) {
      return res.status(400).json({ success: false, message: 'Delivery area must be selected' });
    }
    if (!deliveryAddress || !deliveryAddress.trim()) {
      return res.status(400).json({ success: false, message: 'Delivery address is required' });
    }
    if (!telephone || !telephone.trim()) {
      return res.status(400).json({ success: false, message: 'Telephone number is required' });
    }
    if (/[^0-9]/.test(telephone)) {
      return res.status(400).json({ success: false, message: 'Only numbers are allowed' });
    }
    if (telephone.length < 10) {
      return res.status(400).json({ success: false, message: 'Telephone number must be at least 10 digits' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Email must be a valid format' });
    }
    if (!confirmedOrder) {
      return res.status(400).json({ success: false, message: 'You must confirm the order details' });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        deliveryArea,
        deliveryAddress: deliveryAddress.trim(),
        telephone: telephone.trim(),
        email: email.trim(),
        confirmedOrder: true,
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, message: 'Delivery details saved', data: order });
  } catch (error) {
    next(error);
  }
};
