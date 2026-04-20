import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Package, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const result = await orderService.getOrderHistory();
      setOrders(result.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return Clock;
      case 'Processing':
      case 'Accepted':
      case 'Ready for Pickup':
        return Package;
      case 'Out for Delivery':
        return Truck;
      case 'Delivered':
        return CheckCircle;
      default:
        return AlertCircle;
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Pending': 'badge-warning',
      'Processing': 'badge-info',
      'Accepted': 'badge-info',
      'Ready for Pickup': 'badge-info',
      'Out for Delivery': 'badge-info',
      'Delivered': 'badge-success',
    };
    return statusClasses[status] || 'badge-info';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="mt-2 text-gray-600">Track your orders and deliveries</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center card card-body">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="mb-2 text-lg font-semibold">No Orders Yet</h3>
          <p className="mb-4 text-gray-600">Start shopping from campus stores.</p>
          <Link to="/shops" className="btn-primary">
            Browse Shops
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const StatusIcon = getStatusIcon(order.status);
            return (
              <div key={order._id} className="p-6 card">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-gray-900">
                        Order #{order._id.toString().slice(-8).toUpperCase()}
                      </h3>
                      <span className={`badge ${getStatusBadge(order.status)}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                      <div>
                        <p className="text-gray-600">Shop</p>
                        <p className="font-medium">{order.shopName}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Items</p>
                        <p className="font-medium">{order.items?.length || 0} items</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total</p>
                        <p className="font-medium text-blue-600">LKR {order.grandTotal?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Date</p>
                        <p className="font-medium">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700">Items:</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {order.items?.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 text-sm bg-gray-100 rounded-full"
                          >
                            {item.name} x {item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {order.status !== 'Delivered' && (
                      <Link
                        to={`/delivery/tracking?orderId=${order._id}`}
                        className="text-sm btn-outline"
                      >
                        Track Order
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
