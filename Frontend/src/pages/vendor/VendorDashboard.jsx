import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { shopService, orderService, feedbackService } from '../../services';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Package, ShoppingBag, Truck, Star, TrendingUp, DollarSign } from 'lucide-react';

const VendorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
    feedback: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Get products
      const shopId = user?._id || user?.id;
      const productsResult = await shopService.getProductsByShop(shopId);
      const products = productsResult.data || [];

      // Get orders
      const ordersResult = await orderService.getOrderHistory();
      const allOrders = ordersResult.data || [];
      const userName = user?.name || user?.shopName;
      
      const myOrders = allOrders.filter(o => 
        (o.shop && o.shop === shopId) || 
        (o.shop && o.shop._id === shopId) || 
        o.shopName === userName ||
        user?.role === 'shop_owner' // Fallback for DEMO showing all orders
      ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Revenue Calculation
      const revenue = myOrders.reduce((sum, o) => {
        // You can adjust what statuses count as revenue
        if (o.status !== 'Cancelled') {
          return sum + (o.grandTotal || 0);
        }
        return sum;
      }, 0);

      // Get feedback
      let feedbacksCount = 0;
      try {
        const feedbackResult = await feedbackService.getShopFeedback(user?._id || user?.id);
        if (feedbackResult?.data) {
          feedbacksCount = feedbackResult.data.length;
        }
      } catch (err) {
        console.error('Failed to load feedback stats:', err);
      }

      setStats({
        products: products.length,
        orders: myOrders.length,
        revenue: revenue,
        feedback: feedbacksCount,
      });
      setRecentOrders(myOrders.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickLinks = [
    {
      title: 'Manage Products',
      description: 'Add, edit, or remove products',
      icon: Package,
      to: '/vendor/products',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Orders',
      description: 'Process customer orders',
      icon: ShoppingBag,
      to: '/vendor/orders',
      color: 'bg-green-50 text-accent-dark',
    },
    {
      title: 'Delivery Tracking',
      description: 'Track order deliveries',
      icon: Truck,
      to: '/vendor/delivery',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Customer Feedback',
      description: 'View shop reviews',
      icon: Star,
      to: '/vendor/feedback',
      color: 'bg-yellow-50 text-yellow-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, {user?.shopName}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Total Products',
            value: stats.products,
            icon: Package,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Orders',
            value: stats.orders,
            icon: ShoppingBag,
            color: 'text-accent-dark',
            bg: 'bg-green-50',
          },
          {
            label: 'Revenue',
            value: `LKR ${stats.revenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Customer Reviews',
            value: stats.feedback,
            icon: Star,
            color: 'text-yellow-600',
            bg: 'bg-yellow-50',
          },
        ].map((stat) => (
          <div key={stat.label} className="p-6 card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.title}
              to={link.to}
              className="p-6 transition-shadow card hover:shadow-md group"
            >
              <div className={`w-12 h-12 rounded-lg ${link.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <link.icon className="w-6 h-6" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">{link.title}</h3>
              <p className="text-sm text-gray-600">{link.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between card-header">
          <h3 className="font-semibold">Recent Orders</h3>
          <Link to="/vendor/orders" className="text-sm text-blue-600 hover:text-sky-700">
            View All →
          </Link>
        </div>
        <div className="card-body p-0">
          {recentOrders.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <div key={order._id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="mb-2 sm:mb-0">
                    <p className="font-medium text-gray-900 border-b border-transparent">
                      Order #{order._id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-bold text-gray-900">LKR {order.grandTotal?.toLocaleString()}</p>
                    <span className={`inline-block mt-1 px-2.5 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'Accepted' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'Ready' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'Delivered' ? 'bg-accent/10 text-accent-dark' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No recent orders.</p>
              <p className="mt-2 text-sm">Orders will appear here when customers place them.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
