import { useState, useEffect } from 'react';
import { healthService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import RatingStars from '../../components/common/RatingStars';
import { Calendar, Clock, User, FileText, Upload } from 'lucide-react';

const MyAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      const studentId = user?._id || user?.id;
      if (!studentId) {
        setLoading(false);
        return;
      }
      try {
        const result = await healthService.getStudentAppointments(studentId);
        setAppointments(result.data || []);
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [user]);

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
        <p className="mt-2 text-gray-600">View and manage your medical appointments</p>
      </div>

      {appointments.length === 0 ? (
        <div className="p-12 text-center card card-body">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="mb-2 text-lg font-semibold">No Appointments Yet</h3>
          <p className="mb-4 text-gray-600">Book your first appointment with a doctor.</p>
          <a href="/health/doctors" className="btn-primary">
            Find Doctors
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment._id} className="p-6 card">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {appointment.doctorId?.userId?.name || 'Unknown Doctor'}
                    </h3>
                    <p className="text-sm text-blue-600">{appointment.doctorId?.specialization}</p>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{appointment.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{appointment.timeSlot}</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Symptoms:</p>
                      <p className="text-sm text-gray-600">{appointment.symptoms}</p>
                    </div>

                    {appointment.additionalNotes && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Additional Notes:</p>
                        <p className="text-sm text-gray-600">{appointment.additionalNotes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className={`badge ${getStatusBadge(appointment.status)}`}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </span>

                  {/* Show feedback if appointment is completed */}
                  {appointment.feedback ? (
                    <div className="p-3 rounded-lg bg-gray-50">
                      <p className="mb-1 text-sm font-medium">Your Feedback:</p>
                      <RatingStars rating={appointment.feedback.rating} size="sm" />
                      <p className="mt-1 text-sm text-gray-600">{appointment.feedback.comment}</p>
                    </div>
                  ) : appointment.status === 'approved' ? (
                    <div className="flex flex-col gap-2">
                      <a
                        href={`/feedback/submit?appointment=${appointment._id}`}
                        className="py-2 text-sm btn-outline"
                      >
                        Leave Feedback
                      </a>
                      <a
                        href={`/health/prescriptions?appointment=${appointment._id}`}
                        className="py-2 text-sm btn-outline flex items-center justify-center gap-1"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Prescription
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
