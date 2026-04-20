import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth pages
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Common pages
import Profile from './pages/common/Profile';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import DoctorsList from './pages/student/DoctorsList';
import BookAppointment from './pages/student/BookAppointment';
import MyAppointments from './pages/student/MyAppointments';
import Prescriptions from './pages/student/Prescriptions';
import ShopsList from './pages/student/ShopsList';
import ShopProducts from './pages/student/ShopProducts';
import MyOrders from './pages/student/MyOrders';
import DeliveryTracking from './pages/student/DeliveryTracking';
import FeedbackForm from './pages/student/FeedbackForm';
import Messages from './pages/student/Messages';
import ChatbotPage from './pages/student/ChatbotPage';  import ChatPage from './pages/common/ChatPage';
// Doctor pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorPrescriptions from './pages/doctor/DoctorPrescriptions';
import DoctorFeedback from './pages/doctor/DoctorFeedback';

// Vendor pages
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProducts from './pages/vendor/VendorProducts';
import VendorOrders from './pages/vendor/VendorOrders';
  import VendorDelivery from './pages/vendor/VendorDelivery';
  import VendorDeliveryPersons from './pages/vendor/VendorDeliveryPersons';
  import VendorFeedback from './pages/vendor/VendorFeedback';
import VendorPrescriptions from './pages/vendor/VendorPrescriptions';

// Delivery pages
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import DeliveryAssignments from './pages/delivery/DeliveryAssignments';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminApprovals from './pages/admin/AdminApprovals';
import AdminStats from './pages/admin/AdminStats';
import AdminContacts from './pages/admin/AdminContacts';
import AdminDelivery from './pages/admin/AdminDelivery';

// Removed Inbox as we route to Messages now
import HeroSection from './components/HeroSection';
import ServicesSection from './components/ServicesSection';
import GrocerySection from './components/GrocerySection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorksSection from './components/HowItWorksSection';
import CTASection from './components/CTASection';
// Home Page
const Home = () => (
  <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
              <Navbar/>
              <HeroSection />
              <ServicesSection />
              <CTASection />
          </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes with dashboard layout */}
          <Route element={<DashboardLayout />}>
            {/* Common routes */}
            <Route
              path="/profile"
              element={<Profile />}
            />

            {/* Student routes */}
            <Route
              path="/student/dashboard"
              element={<StudentDashboard />}
            />
            <Route
              path="/health/doctors"
              element={<DoctorsList />}
            />
            <Route
              path="/health/book-appointment/:doctorId"
              element={<BookAppointment />}
            />
            <Route
              path="/health/my-appointments"
              element={<MyAppointments />}
            />
            <Route
              path="/health/prescriptions"
              element={<Prescriptions />}
            />
            <Route
              path="/shops"
              element={<ShopsList />}
            />
            <Route
              path="/shops/:shopId/products"
              element={<ShopProducts />}
            />
            <Route
              path="/orders/my"
              element={<MyOrders />}
            />
            <Route
              path="/delivery/tracking"
              element={<DeliveryTracking />}
            />
            <Route
              path="/feedback/submit"
              element={<FeedbackForm />}
            />
            <Route
              path="/messages"
              element={<Messages />}
            />
            <Route path="/chatbot" element={<ChatbotPage />} /><Route path="/chat" element={<ChatPage />} />

            
            <Route
              path="/doctor/dashboard"
              element={<DoctorDashboard />}
            />
            <Route
              path="/doctor/appointments"
              element={<DoctorAppointments />}
            />
            <Route
              path="/doctor/prescriptions"
              element={<DoctorPrescriptions />}
            />
            <Route
              path="/doctor/feedback"
              element={<DoctorFeedback />}
            />
            <Route
              path="/messages/received"
                element={<Messages />} /* Changed from Inbox to use Support Tickets */
            />
            {/* Vendor routes */}
            <Route
              path="/vendor/dashboard"
              element={<VendorDashboard />}
            />
            <Route
              path="/vendor/prescriptions"
              element={<VendorPrescriptions />}
            />
            <Route
              path="/vendor/products"
              element={<VendorProducts />}
            />
            <Route
              path="/vendor/orders"
              element={<VendorOrders />}
            />
            <Route
              path="/vendor/delivery"
              element={<VendorDelivery />}
            />
            <Route
              path='/vendor/feedback'
              element={<VendorFeedback/>}
            />
            <Route
                path="/vendor/delivery-persons"
                element={<VendorDeliveryPersons />}
              />
            <Route
              path="/delivery/dashboard"
              element={<DeliveryDashboard />}
            />
            <Route
              path="/delivery/assignments"
              element={<DeliveryAssignments />}
            />

            {/* Admin routes */}
            <Route
              path="/admin/dashboard"
              element={<AdminDashboard />}
            />
            <Route
              path="/admin/users"
              element={<AdminUsers />}
            />
            <Route
              path="/admin/approvals"
              element={<AdminApprovals />}
            />
            <Route
              path="/admin/stats"
              element={<AdminStats />}
            />
            <Route
              path="/admin/contacts"
              element={<AdminContacts />}
            />
            <Route
              path="/admin/delivery"
              element={<AdminDelivery />}
            />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

