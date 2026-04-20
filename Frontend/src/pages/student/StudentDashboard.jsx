import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Heart,
  ShoppingBag,
  Calendar,
  MessageCircle,
  Bot,
  Truck,
  Star,
  Activity,
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    appointments: 0,
    orders: 0,
    messages: 0,
    reviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch actual stats from API endpoints
    // For now, using placeholder data
    setLoading(false);
  }, []);

  const quickLinks = [
    {
      title: 'Health Services',
      description: 'Book appointments with doctors',
      icon: Heart,
      to: '/health/doctors',
      color: 'bg-red-50 text-red-600',
    },
    {
      title: 'Campus Shops',
      description: 'Order products from campus stores',
      icon: ShoppingBag,
      to: '/shops',
      color: 'bg-green-50 text-accent-dark',
    },
    {
      title: 'My Appointments',
      description: 'View and manage your appointments',
      icon: Calendar,
      to: '/health/my-appointments',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'My Orders',
      description: 'Track your orders and deliveries',
      icon: Truck,
      to: '/orders/my',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'AI Assistant',
      description: 'Get career guidance and business ideas',
      icon: Bot,
      to: '/chatbot',
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      title: 'Messages',
      description: 'Contact doctors and vendors',
      icon: MessageCircle,
      to: '/messages',
      color: 'bg-yellow-50 text-yellow-600',
    },
    {
      title: 'Give Feedback',
      description: 'Rate services and providers',
      icon: Star,
      to: '/feedback/submit',
      color: 'bg-pink-50 text-pink-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-gray-600 mt-2">Your student health & career support hub</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Appointments', value: stats.appointments, icon: Calendar, color: 'text-blue-600' },
          { label: 'Orders', value: stats.orders, icon: ShoppingBag, color: 'text-accent-dark' },
          { label: 'Messages', value: stats.messages, icon: MessageCircle, color: 'text-yellow-600' },
          { label: 'Reviews Given', value: stats.reviews, icon: Star, color: 'text-purple-600' },
        ].map((stat) => (
          <div key={stat.label} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.title}
              to={link.to}
              className="card p-6 hover:shadow-md transition-shadow group"
            >
              <div className={`w-12 h-12 rounded-lg ${link.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <link.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{link.title}</h3>
              <p className="text-sm text-gray-600">{link.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </h3>
        </div>
        <div className="card-body">
          <div className="text-center py-8 text-gray-500">
            <p>No recent activity to show.</p>
            <p className="text-sm mt-2">Start booking appointments, ordering products, or using the AI assistant!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
