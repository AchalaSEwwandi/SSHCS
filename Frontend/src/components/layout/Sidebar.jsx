import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Heart,
  Users,
  Calendar,
  FileText,
  ShoppingBag,
  Package,
  Truck,
  MessageCircle,
  MessageSquare,
  Star,
  Settings,
  Shield,
  Bot,
  BarChart3,
  FileQuestion,
  Inbox,
  LogOut,
} from 'lucide-react';

const Sidebar = ({ user }) => {
  const { isAdmin, isDoctor, isStudent, isVendor, isDelivery, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const studentLinks = [
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/health/doctors', icon: Heart, label: 'Find Doctors' },
    { to: '/health/my-appointments', icon: Calendar, label: 'My Appointments' },
    { to: '/health/prescriptions', icon: FileText, label: 'Prescriptions' },
    { to: '/shops', icon: ShoppingBag, label: 'Campus Shops' },
    { to: '/orders/my', icon: Package, label: 'My Orders' },
    { to: '/delivery/tracking', icon: Truck, label: 'Delivery Tracking' },
    { to: '/feedback/submit', icon: Star, label: 'Give Feedback' },
    { to: '/messages', icon: MessageCircle, label: 'Support Tickets' },
    { to: '/chat', icon: MessageSquare, label: 'Live Chat' },
    { to: '/chatbot', icon: Bot, label: 'AI Assistant' },
  ];

  const doctorLinks = [
    { to: '/doctor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/doctor/appointments', icon: Calendar, label: 'Appointments' },
    { to: '/doctor/feedback', icon: Star, label: 'Patient Feedback' },
    { to: '/messages/received', icon: Inbox, label: 'Support Tickets' },
    { to: '/chat', icon: MessageSquare, label: 'Live Chat' },
  ];

  const vendorLinks = [
    { to: '/vendor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/vendor/prescriptions', icon: FileText, label: 'Prescriptions Queue' },
    { to: '/vendor/products', icon: Package, label: 'Products' },
    { to: '/vendor/orders', icon: ShoppingBag, label: 'Orders' },
    { to: '/vendor/delivery', icon: Truck, label: 'Delivery Tracking' }, { to: '/vendor/delivery-persons', icon: Users, label: 'Delivery Persons' }, { to: '/vendor/feedback', icon: Star, label: 'Customer Feedback' },
    { to: '/messages/received', icon: Inbox, label: 'Support Tickets' },
    { to: '/chat', icon: MessageSquare, label: 'Live Chat' },
  ];

  const deliveryLinks = [
    { to: '/delivery/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/delivery/assignments', icon: Truck, label: 'Assignments' },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'User Management' },
    { to: '/admin/approvals', icon: Shield, label: 'Pending Approvals' },
    { to: '/admin/stats', icon: BarChart3, label: 'Statistics' },
    { to: '/admin/contacts', icon: MessageCircle, label: 'Contact Submissions' },
  ];

  let links = [];
  if (isStudent) links = studentLinks;
  if (isDoctor) links = doctorLinks;
  if (isVendor) links = vendorLinks;
  if (isDelivery) links = deliveryLinks;
  if (isAdmin) links = adminLinks;

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 overflow-y-auto bg-white border-r border-gray-200 lg:block">
      <div className="p-4">
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full">
              <span className="text-lg font-medium text-gray-600">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        <nav className="space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/student/dashboard' || link.to === '/doctor/dashboard' || link.to === '/vendor/dashboard' || link.to === '/delivery/dashboard' || link.to === '/admin/dashboard'}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                }`
              }
            >
              <link.icon className="flex-shrink-0 w-5 h-5 mr-3" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="pt-6 mt-8 space-y-2 border-t border-gray-200">
          <NavLink
            to="/profile"
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 transition-colors rounded-lg hover:text-blue-600 hover:bg-gray-50"
          >
            <Settings className="w-5 h-5 mr-3" />
            My Profile
          </NavLink>
          <NavLink
            to="/"
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 transition-colors rounded-lg hover:text-blue-600 hover:bg-gray-50"
          >
            <Heart className="w-5 h-5 mr-3" />
            Back to Home
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-left text-red-600 transition-colors rounded-lg hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

