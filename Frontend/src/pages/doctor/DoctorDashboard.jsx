import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { healthService } from '../../services';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Calendar, FileText, MessageSquare, Star, Users, TrendingUp } from 'lucide-react';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    appointments: 0,
    pending: 0,
    prescriptions: 0,
    feedbackCount: 0,
    avgRating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && (user._id || user.id)) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const doctorId = user._id || user.id;
      if (!doctorId) return;

      const [apptsResult, feedbackResult] = await Promise.all([
        healthService.getDoctorAppointments(doctorId),
        healthService.getDoctorFeedback(doctorId),
      ]);

      const appointments = apptsResult.data || [];
      const feedbacks = feedbackResult.data || [];
      const statsObj = feedbackResult.stats || { total: 0 };
      
      const avgRating = feedbacks.length > 0 
        ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length 
        : 0;

      setStats({
        appointments: appointments.length,
        pending: appointments.filter((a) => a.status === 'pending').length,
        prescriptions: 0, // Will be fetched separately
        feedbackCount: statsObj.total,
        avgRating,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickLinks = [
    {
      title: 'Appointments',
      description: 'Manage patient appointments',
      icon: Calendar,
      to: '/doctor/appointments',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Prescriptions',
      description: 'Review and approve prescriptions',
      icon: FileText,
      to: '/doctor/prescriptions',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Patient Feedback',
      description: 'View ratings and reviews',
      icon: Star,
      to: '/doctor/feedback',
      color: 'bg-yellow-50 text-yellow-600',
    },
    {
      title: 'Messages',
      description: 'Student communications',
      icon: MessageSquare,
      to: '/messages/received',
      color: 'bg-green-50 text-accent-dark',
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
        <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, Dr. {user?.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Total Appointments',
            value: stats.appointments,
            icon: Calendar,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Pending Approval',
            value: stats.pending,
            icon: Users,
            color: 'text-yellow-600',
            bg: 'bg-yellow-50',
          },
          {
            label: 'Patient Feedback',
            value: stats.feedbackCount,
            icon: Star,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
          {
            label: 'Average Rating',
            value: stats.avgRating?.toFixed(1) || 'N/A',
            icon: TrendingUp,
            color: 'text-accent-dark',
            bg: 'bg-green-50',
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

      {/* Recent Appointments */}
      <div className="card">
        <div className="flex items-center justify-between card-header">
          <h3 className="font-semibold">Recent Appointments</h3>
          <Link to="/doctor/appointments" className="text-sm text-blue-600 hover:text-sky-700">
            View All →
          </Link>
        </div>
        <div className="card-body">
          <p className="py-8 text-center text-gray-500">Loading recent appointments...</p>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
