import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { deliveryService, orderService } from '../../services';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Truck, MapPin, Phone, User, CheckCircle, AlertCircle, ShoppingBag } from 'lucide-react';

const DeliveryTracking = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialOrderId = searchParams.get('orderId');

  const [activeOrders, setActiveOrders] = useState([]);
  const [orderQueryLoading, setOrderQueryLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrderId || '');

  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // When selected order changes, fetch its tracking
  useEffect(() => {
    if (selectedOrderId) {
      fetchTracking(selectedOrderId);
      setSearchParams({ orderId: selectedOrderId });
    } else {
      setTracking(null);
    }
  }, [selectedOrderId, setSearchParams]);

  const fetchOrders = async () => {
    setOrderQueryLoading(true);
    try {
      const response = await orderService.getOrderHistory();
      // Filter orders that need delivery and sort newest first
      const trackedOrders = (response.data || [])
        .filter(o => 
        ['Pending', 'Processing', 'Accepted', 'Ready for Pickup', 'Out for Delivery', 'Delivered'].includes(o.status)
      ).sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));
      
      setActiveOrders(trackedOrders);
      // Auto select the first tracking if no ID is given
      if (!selectedOrderId && trackedOrders.length > 0) {
        setSelectedOrderId(trackedOrders[0]._id);
      }
    } catch (err) {
      console.error("Failed to fetch user orders:", err);
    } finally {
      setOrderQueryLoading(false);
    }
  };

  const fetchTracking = async (id) => {
    setLoading(true);
    setError('');
    try {
      const result = await deliveryService.getDeliveryTracking(id);
      setTracking(result.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tracking information');
      setTracking(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!selectedOrderId) return;
    try {
      await deliveryService.markDelivered(selectedOrderId);
      alert('Order marked as delivered! Thank you for using our service.');
      fetchTracking(selectedOrderId);
    } catch (err) {
      alert('Failed to update delivery status');
    }
  };

  const steps = ['Pending', 'Ready for Pickup', 'Out for Delivery', 'Delivered'];

  const getStepIndex = (status) => {
    switch (status) {
      case 'Pending':
      case 'Processing':
      case 'Accepted':
        return 0;
      case 'Ready for Pickup':
        return 1;
      case 'Out for Delivery':
        return 2;
      case 'Delivered':
        return 3;
      default:
        return 0;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Tracking</h1>
          <p className="mt-2 text-gray-600">Track your orders from the shop to your door</p>
        </div>
      </div>

      {/* Order Selector (User Friendly) */}
      {activeOrders.length > 0 && (
        <div className="w-full pb-2 overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            {activeOrders.map(order => {
              const isSelected = selectedOrderId === order._id;
              return (
                <button
                  key={order._id}
                  onClick={() => setSelectedOrderId(order._id)}
                  className={`flex flex-col items-start p-4 border-2 rounded-xl transition-all w-64 text-left ${
                    isSelected 
                      ? 'border-primary-600 bg-primary-50' 
                      : 'border-gray-200 bg-white hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className={`font-bold ${isSelected ? 'text-primary-900' : 'text-gray-900'}`}>
                      #{order._id.slice(-6).toUpperCase()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                      order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                      order.status === 'Out for Delivery' ? 'bg-blue-100 text-blue-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-800">{order.shopName || 'Shop'}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recent'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedOrderId && tracking && (
        <div className="p-4 card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-primary-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Tracking Order</p>
                <p className="font-bold text-gray-900">#{selectedOrderId.slice(-8).toUpperCase()}</p>
              </div>
            </div>
            <button
              onClick={() => fetchTracking(selectedOrderId)}
              className="px-4 py-2 text-sm btn-outline"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Status'}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-3 px-4 py-3 text-red-600 border border-red-200 rounded-lg bg-red-50">
          <AlertCircle className="w-5 h-5"/>
          {error}
        </div>
      )}

      {(!selectedOrderId || (!tracking && !loading)) && !error && (
        <div className="p-12 text-center card card-body">
          <Truck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="mb-2 text-xl font-bold text-gray-800">No Active Tracking</h3>
          <p className="max-w-md mx-auto mb-6 text-gray-600">
            You don't have any active deliveries to track right now. When you place an order, it will appear here.
          </p>
          <Link to="/shops" className="btn-primary">
            Browse Shops
          </Link>
        </div>
      )}

      {tracking && !loading && (
        <div className="space-y-6">
          {/* Progress Timeline */}
          <div className="p-6 card">
            <h3 className="mb-6 font-semibold">Delivery Progress</h3>
            <div className="relative">
              {steps.map((step, index) => {
                const currentStepIndex = getStepIndex(tracking.status);
                const isCompleted = index <= currentStepIndex;

                return (
                  <div key={step} className="relative flex items-start mb-8 last:mb-0">
                    {/* Line */}
                    {index < steps.length - 1 && (
                      <div
                        className={`absolute left-4 top-8 w-0.5 h-full ${
                          isCompleted ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                        style={{ transform: 'translateX(-50%)' }}
                      ></div>
                    )}

                    {/* Circle */}
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* Content */}
                    <div className="flex-1 ml-4">
                      <p
                        className={`font-medium ${
                          isCompleted ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {index === 0 && ['Pending', 'Processing', 'Accepted'].includes(tracking.status) ? tracking.status : step}
                      </p>
                      {isCompleted && currentStepIndex === index && (
                        <p className="text-sm font-medium text-blue-600">Current Status</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Details */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="p-6 card">
              <h3 className="pb-3 mb-4 text-lg font-semibold border-b border-gray-100">Delivery Information</h3>
              <div className="pt-2 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary-50">
                    <User className="w-5 h-5 border border-transparent text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Delivery Person</p>
                    <p className="mt-1 font-bold text-gray-900">
                      {tracking.deliveryPersonName || 'Looking for driver...'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary-50">
                    <Phone className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Contact</p>
                    <p className="mt-1 font-bold text-gray-900">
                      {tracking.deliveryPersonPhone || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary-50">
                    <Truck className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Vehicle</p>
                    <p className="mt-1 font-bold text-gray-900">
                      {tracking.vehicleType || 'N/A'} {tracking.vehicleNumber ? `- ${tracking.vehicleNumber}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 card">
              <h3 className="pb-3 mb-4 text-lg font-semibold border-b border-gray-100">Order Details</h3>
              <div className="pt-2 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Delivery Destination</p>
                    <p className="mt-1 font-bold text-gray-900">{tracking.deliveryAddress || 'Campus Hub'}</p>
                    <p className="mt-1 text-xs text-gray-500">{tracking.deliveryArea}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 pr-2">
                    <p className="text-sm font-medium text-gray-500">Shop</p>
                    <p className="mt-1 font-bold text-gray-900">{tracking.storeName || 'Campus Shop'}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 mt-4 border border-gray-100 rounded-lg bg-gray-50">
                  <p className="text-sm font-medium text-gray-600">Order Total</p>
                  <p className="text-lg font-bold text-gray-900">
                    LKR {(tracking.totalAmount || tracking.grandTotal || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {tracking.status === 'Out for Delivery' && (
            <div className="p-6 border-yellow-200 card bg-yellow-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Order in Progress</p>
                    <p className="text-sm text-yellow-700">
                      Your order is being prepared and will be delivered soon.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleMarkDelivered}
                  className="btn-primary"
                  disabled={tracking.status === 'Delivered'}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Received
                </button>
              </div>
            </div>
          )}

          {tracking.status === 'Delivered' && (
            <div className="p-6 border-accent/20 card bg-green-50">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-accent-dark" />
                <div>
                  <p className="font-medium text-accent-dark">Order Delivered</p>
                  <p className="text-sm text-accent-dark">
                    Your order has been successfully delivered. Thank you for shopping with us!
                  </p>
                </div>
              </div>
              {/* Feedback Button */}
              <div className="flex justify-end mt-6">
                <Link
                  to={`/feedback/submit?order=${selectedOrderId}`}
                  className="btn-primary"
                  state={{
                    targetType: 'shop',
                    shopId: tracking.shopId || tracking.storeId,
                    shopName: tracking.shopName || tracking.storeName
                  }}
                >
                  Give Feedback to Shop
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryTracking;
