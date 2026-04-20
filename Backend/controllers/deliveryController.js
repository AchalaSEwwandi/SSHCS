import DeliveryPerson from '../models/DeliveryPerson.js';
import DeliveryAssignment from '../models/DeliveryAssignment.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { sendAssignmentEmail } from '../utils/sendEmail.js';

/**
 * POST /api/delivery/persons
 * Create a delivery person (admin only)
 */
export const createDeliveryPerson = async (req, res, next) => {
  try {
    const { storeName, fullName, phone, nic, email, password, vehicleType, vehicleNumber, deliveryArea, availability } = req.body;

    if (!storeName || typeof storeName !== 'string' || !storeName.trim()) {
      return res.status(400).json({ success: false, message: 'Store name is required' });
    }
    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    if (!nic || typeof nic !== 'string' || !nic.trim()) {
      return res.status(400).json({ success: false, message: 'NIC/ID is required' });
    }
    if (!vehicleType || typeof vehicleType !== 'string') {
      return res.status(400).json({ success: false, message: 'Vehicle type is required' });
    }
    if (!vehicleNumber || typeof vehicleNumber !== 'string' || !vehicleNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Vehicle number is required' });
    }
    if (!deliveryArea || typeof deliveryArea !== 'string' || !deliveryArea.trim()) {
      return res.status(400).json({ success: false, message: 'Delivery area is required' });
    }

    // Check if NIC already exists
    const existing = await DeliveryPerson.findOne({ nic: nic.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A delivery person with this NIC already exists' });
    }

    // Create a User account for the delivery person
    const generatedEmail = email ? email.toLowerCase() : `${nic.trim()}@delivery.com`;
    
    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email: generatedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists. Please use a different email.' });
    }

    const user = new User({
      name: fullName.trim(),
      email: generatedEmail,
      password: password || nic.trim(), // Default password is NIC if not provided
      nic: nic.trim(),
      vehicleType: vehicleType,
      role: 'delivery_person',
    });
    
    await user.save();

    const person = new DeliveryPerson({
      userId: user._id,
      storeName: storeName.trim(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      nic: nic.trim(),
      vehicleType: vehicleType.trim(),
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      deliveryArea: deliveryArea.trim(),
      availability: availability || 'Available',
    });

    await person.save();
    res.status(201).json({ success: true, message: 'Delivery person created successfully', data: person });
  } catch (error) {
    next(error);
  }
};

export const updateDeliveryPerson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const person = await DeliveryPerson.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!person) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Delivery person updated', data: person });
  } catch (error) {
    next(error);
  }
};

export const deleteDeliveryPerson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const person = await DeliveryPerson.findByIdAndDelete(id);
    if (!person) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Delivery person deleted' });
  } catch (error) {
    next(error);
  }
};

export const assignDeliveryPerson = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { deliveryPersonId } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const dp = await DeliveryPerson.findById(deliveryPersonId).populate('userId');
    if (!dp) return res.status(404).json({ success: false, message: 'Delivery person not found' });
    
    // Instead of setting Busy immediately, wait for acceptance
    
    order.status = 'Processing';
    await order.save();

    const assignment = new DeliveryAssignment({
      order: orderId,
      deliveryPerson: dp._id,
      deliveryPersonName: dp.fullName,
      deliveryPersonPhone: dp.phone,
      vehicleType: dp.vehicleType,
      vehicleNumber: dp.vehicleNumber,
    });
    
    await assignment.save();
    
    // Send email to delivery person
    if (dp.userId && dp.userId.email) {
      try {
        await sendAssignmentEmail({
          to: dp.userId.email,
          deliveryPersonName: dp.fullName,
          orderId: order._id.toString(),
          shopName: order.shopName || 'Shop',
          assignmentId: assignment._id.toString(),
        });
      } catch (err) {
        console.error('Failed to send assignment email:', err);
      }
    }

    res.json({ success: true, message: 'Assigned successfully', data: assignment });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/delivery/persons
 * Get all delivery persons (optional filter by store)
 */
export const getDeliveryPersons = async (req, res, next) => {
  try {
    const { storeName } = req.query;
    const filter = storeName ? { storeName } : {};

    const persons = await DeliveryPerson.find(filter)
      .sort({ createdAt: -1 });

    res.json({ success: true, count: persons.length, data: persons });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/delivery/tracking/:orderId
 * Get delivery tracking details (auto-assigns if not assigned)
 */
export const getDeliveryTracking = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Populate assignment and delivery person details
    let assignment = await DeliveryAssignment.findOne({ order: orderId }).populate('deliveryPerson');
    let assignmentPending = !assignment;

    res.json({
      success: true,
      assignmentPending,
      data: {
        orderId: order._id,
        storeName: order.shopName || 'Campus Shop',
        status: order.status,
        totalAmount: order.totalAmount,
        deliveryAddress: order.deliveryAddress,
        deliveryPersonName: assignment?.deliveryPerson?.fullName || assignment?.deliveryPersonName || '',
        deliveryPersonPhone: assignment?.deliveryPerson?.phone || '',
        vehicleType: assignment?.deliveryPerson?.vehicleType || '',
        vehicleNumber: assignment?.deliveryPerson?.vehicleNumber || '',
        updatedAt: order.updatedAt || order.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/delivery/:orderId/mark-delivered
 * Mark an order as delivered and free up delivery person
 */
export const markDelivered = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: 'Delivered' },
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

    res.json({
      success: true,
      message: 'Order marked as Delivered',
      data: { status: order.status },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/delivery/stats
 * Get delivery statistics (for admin)
 */
export const getDeliveryStats = async (req, res, next) => {
  try {
    const totalPersons = await DeliveryPerson.countDocuments();
    const availablePersons = await DeliveryPerson.countDocuments({ availability: 'Available' });
    const activeAssignments = await DeliveryAssignment.countDocuments();

    res.json({
      success: true,
      data: {
        totalDeliveryPersons: totalPersons,
        availableDeliveryPersons: availablePersons,
        activeAssignments,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/delivery/my-assignments
 * Get assignments for the logged-in delivery person
 */
export const getMyAssignments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const person = await DeliveryPerson.findOne({ userId });
    
    if (!person) {
      return res.status(404).json({ success: false, message: 'Delivery person profile not found for this user.' });
    }

    // Get assignments
    const assignments = await DeliveryAssignment.find({ deliveryPerson: person._id }).populate('order').sort({ createdAt: -1 });

    res.json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/delivery/my-dashboard
 * Get stats for the logged-in delivery person
 */
export const getMyDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const person = await DeliveryPerson.findOne({ userId });
    
    if (!person) {
      return res.status(404).json({ success: false, message: 'Delivery person profile not found for this user.' });
    }

    const assignments = await DeliveryAssignment.find({ deliveryPerson: person._id }).populate('order');
    
      const active = assignments.filter(a => a.order && ['Accepted', 'Ready for Pickup', 'Out for Delivery'].includes(a.order.status)).length;
    const completed = assignments.filter(a => a.order && a.order.status === 'Delivered').length;
    const pending = assignments.filter(a => a.order && a.order.status === 'Pending').length;

    const pendingAssignmentsList = await DeliveryAssignment.find({ deliveryPerson: person._id, status: 'Pending' }).populate('order');

    // Recent deliveries (accepted or completed)
    const recentDeliveries = assignments
      .filter(a => a.status !== 'Pending')
      .slice(0, 5)
      .map(a => ({
        id: a.order ? a.order._id : a._id,
        shop: a.order ? a.order.shopName : 'Unknown Shop',
        dest: a.order ? a.order.deliveryAddress : 'Unknown location',
        status: a.status === 'Accepted' ? 'Active' : a.order ? a.order.status : 'Unknown',
        time: a.createdAt
    }));

    res.json({
      success: true,
      data: {
        stats: { active, completed, pending },
        recentDeliveries,
        pendingAssignments: pendingAssignmentsList
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/delivery/assignments/:id/respond
 * Accept or reject a delivery assignment
 */
export const respondToAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { response } = req.body; // 'Accept' or 'Reject'
    
    const assignment = await DeliveryAssignment.findById(id).populate('order');
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    
    if (response === 'Accept') {
      assignment.status = 'Accepted';
      await assignment.save();
      
      const dp = await DeliveryPerson.findById(assignment.deliveryPerson);
      if (dp) {
        dp.availability = 'Busy';
        await dp.save();
      }
      
      if (assignment.order) {
        assignment.order.status = 'Processing';
        await assignment.order.save();
      }
      return res.json({ success: true, message: 'Assignment accepted' });
    } else if (response === 'Reject') {
      assignment.status = 'Rejected';
      await assignment.save();
      
      // Optionally could reset order status back to pending assignment, etc.
      // But we just mark it rejected for now.
      
      return res.json({ success: true, message: 'Assignment rejected' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid response' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/delivery/assignments/:id/email-respond
 * Accept or reject a delivery assignment from email link
 */
export const respondToAssignmentEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { response } = req.query; // 'Accept' or 'Reject'
    
    const assignment = await DeliveryAssignment.findById(id).populate('order');
    if (!assignment) {
      return res.status(404).send(`
        <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
          <h2>Assignment Not Found</h2>
          <p>The delivery assignment you are trying to respond to does not exist.</p>
        </div>
      `);
    }

    if (assignment.status !== 'Pending') {
      return res.status(400).send(`
        <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
          <h2>Assignment Already Processed</h2>
          <p>This assignment has already been ${assignment.status.toLowerCase()}.</p>
        </div>
      `);
    }
    
    if (response === 'Accept') {
      assignment.status = 'Accepted';
      await assignment.save();
      
      const dp = await DeliveryPerson.findById(assignment.deliveryPerson);
      if (dp) {
        dp.availability = 'Busy';
        await dp.save();
      }
      
      if (assignment.order) {
        assignment.order.status = 'Processing';
        await assignment.order.save();
      }
      return res.send(`
        <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
          <h2 style="color: #22c55e;">Assignment Accepted</h2>
          <p>You have successfully accepted the delivery assignment.</p>
          <p>You can now close this window or log in to view details.</p>
        </div>
      `);
    } else if (response === 'Reject') {
      assignment.status = 'Rejected';
      await assignment.save();
      
      return res.send(`
        <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
          <h2 style="color: #ef4444;">Assignment Rejected</h2>
          <p>You have rejected the delivery assignment.</p>
          <p>You can now close this window.</p>
        </div>
      `);
    } else {
      return res.status(400).send(`
        <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
          <h2>Invalid Response</h2>
          <p>The action you selected is not valid.</p>
        </div>
      `);
    }
  } catch (error) {
    console.error('Error responding from email:', error);
    res.status(500).send(`
      <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
        <h2>Server Error</h2>
        <p>An error occurred while processing your response. Please try again later.</p>
      </div>
    `);
  }
};


