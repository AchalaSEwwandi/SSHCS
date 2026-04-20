export const getDeliveryTracking = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let assignment = await DeliveryAssignment.findOne({ order: orderId });
    let assignmentPending = !assignment;

    res.json({
      success: true,
      assignmentPending,
      data: {
        orderId: order._id,
        storeName: order.shopName || 'Campus Shop',
        deliveryPersonName: assignment ? assignment.deliveryPersonName : '',
        deliveryPersonPhone: assignment ? assignment.deliveryPersonPhone : '',
        vehicleType: assignment ? assignment.vehicleType : '',
        vehicleNumber: assignment ? assignment.vehicleNumber : '',
        status: order.status,
        grandTotal: order.grandTotal,
        deliveryAddress: order.deliveryAddress || '',
        deliveryArea: order.deliveryArea || '',
        telephone: order.telephone || '',
        createdAt: order.createdAt,
        updatedAt: order.updatedAt || order.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
