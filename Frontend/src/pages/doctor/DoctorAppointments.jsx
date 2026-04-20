import { useState, useEffect, useMemo } from 'react';
import { healthService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  FileText,
} from 'lucide-react';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Normalise an appointment date string to 'YYYY-MM-DD'.
 * Handles both ISO timestamps and plain date strings.
 */
const normalizeDateStr = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const DoctorAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Calendar state
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Modal state
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchInit = async () => {
      const doctorId = user?._id || user?.id;
      if (!doctorId) {
        setLoading(false);
        return;
      }
      try {
        const result = await healthService.getDoctorAppointments(doctorId);
        setAppointments(result.data || []);
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInit();
  }, [user]);

  const fetchAppointments = async () => {
    const doctorId = user?._id || user?.id;
    if (!doctorId) return;
    try {
      const result = await healthService.getDoctorAppointments(doctorId);
      setAppointments(result.data || []);
    } catch (error) {
      console.error('Failed to update appointments:', error);
    }
  };

  const handleApprove = async (appointmentId) => {
    try {
      await healthService.approveAppointment(appointmentId);
      fetchAppointments();
    } catch (error) {
      alert('Failed to approve appointment');
    }
  };

  const handleReject = async (appointmentId) => {
    try {
      await healthService.rejectAppointment(appointmentId);
      fetchAppointments();
    } catch (error) {
      alert('Failed to reject appointment');
    }
  };

  // ── Filter logic ──
  const filteredAppointments = useMemo(() => {
    return filter === 'all'
      ? appointments
      : appointments.filter((a) => a.status === filter);
  }, [appointments, filter]);

  // ── Build a map of date → appointments for fast calendar lookup ──
  const dateAppointmentMap = useMemo(() => {
    const map = {};
    filteredAppointments.forEach((appt) => {
      const key = normalizeDateStr(appt.date);
      if (!map[key]) map[key] = [];
      map[key].push(appt);
    });
    return map;
  }, [filteredAppointments]);

  // ── Calendar helpers ──
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const handleDateClick = (dateKey, dayAppointments) => {
    if (dayAppointments.length === 0) return;
    setSelectedDate(dateKey);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  // ── Status helpers ──
  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
    };
    return statusClasses[status] || 'badge-info';
  };

  const getStatusDotColor = (status) => {
    const colors = {
      pending: 'bg-amber-400',
      approved: 'bg-emerald-500',
      rejected: 'bg-red-400',
    };
    return colors[status] || 'bg-blue-400';
  };

  // Appointments for selected date modal
  const modalAppointments = selectedDate ? (dateAppointmentMap[selectedDate] || []) : [];

  // ── Stats ──
  const stats = useMemo(() => {
    return {
      total: appointments.length,
      pending: appointments.filter((a) => a.status === 'pending').length,
      approved: appointments.filter((a) => a.status === 'approved').length,
      rejected: appointments.filter((a) => a.status === 'rejected').length,
    };
  }, [appointments]);

  // ── Build calendar cells ──
  const calendarCells = useMemo(() => {
    const cells = [];
    // Leading empty cells
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push({ day: null, key: `empty-${i}` });
    }
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(currentMonth + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateKey = `${currentYear}-${mm}-${dd}`;
      const dayAppointments = dateAppointmentMap[dateKey] || [];
      const isToday =
        d === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear();
      cells.push({ day: d, dateKey, dayAppointments, isToday, key: dateKey });
    }
    return cells;
  }, [currentMonth, currentYear, daysInMonth, firstDayOfMonth, dateAppointmentMap]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-2">Manage patient appointments</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && (
                <span className="ml-1.5 text-xs opacity-80">({stats[f]})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'bg-blue-50 text-blue-700 border-blue-100', icon: Calendar },
          { label: 'Pending', value: stats.pending, color: 'bg-amber-50 text-amber-700 border-amber-100', icon: AlertCircle },
          { label: 'Approved', value: stats.approved, color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle },
          { label: 'Rejected', value: stats.rejected, color: 'bg-red-50 text-red-700 border-red-100', icon: XCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={`rounded-xl border p-4 ${color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">{label}</p>
                <p className="text-2xl font-bold mt-1">{value}</p>
              </div>
              <Icon className="w-8 h-8 opacity-40" />
            </div>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="card overflow-hidden">
        {/* Calendar header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={goToToday}
              className="text-xs text-white/70 hover:text-white transition-colors mt-0.5"
            >
              Go to today
            </button>
          </div>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarCells.map((cell) => {
            if (cell.day === null) {
              return <div key={cell.key} className="min-h-[80px] md:min-h-[100px] bg-gray-50/50 border-b border-r border-gray-100" />;
            }

            const hasAppointments = cell.dayAppointments.length > 0;
            const isSelected = selectedDate === cell.dateKey;

            // Group by status for the dots
            const statusCounts = {};
            cell.dayAppointments.forEach((appt) => {
              statusCounts[appt.status] = (statusCounts[appt.status] || 0) + 1;
            });

            return (
              <button
                key={cell.key}
                onClick={() => handleDateClick(cell.dateKey, cell.dayAppointments)}
                disabled={!hasAppointments}
                className={`
                  min-h-[80px] md:min-h-[100px] p-2 border-b border-r border-gray-100 text-left
                  transition-all duration-200 relative group
                  ${hasAppointments ? 'cursor-pointer hover:bg-blue-50 hover:shadow-inner' : 'cursor-default'}
                  ${isSelected ? 'bg-blue-50 ring-2 ring-inset ring-blue-400' : ''}
                  ${cell.isToday ? 'bg-blue-50/40' : ''}
                `}
              >
                {/* Day number */}
                <span
                  className={`
                    inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium
                    ${cell.isToday
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : hasAppointments
                        ? 'text-gray-900 font-semibold'
                        : 'text-gray-400'
                    }
                  `}
                >
                  {cell.day}
                </span>

                {/* Appointment indicators */}
                {hasAppointments && (
                  <div className="mt-1 space-y-0.5">
                    {Object.entries(statusCounts).map(([status, count]) => (
                      <div
                        key={status}
                        className={`
                          flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium
                          ${status === 'pending' ? 'bg-amber-100 text-amber-700' : ''}
                          ${status === 'approved' ? 'bg-emerald-100 text-emerald-700' : ''}
                          ${status === 'rejected' ? 'bg-red-100 text-red-700' : ''}
                        `}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(status)}`} />
                        <span className="hidden md:inline">{count} {status}</span>
                        <span className="md:hidden">{count}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hover tooltip for count */}
                {hasAppointments && (
                  <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-lg">
                      {cell.dayAppointments.length}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          <span className="font-medium">Legend:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Pending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Approved
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Rejected
          </span>
        </div>
      </div>

      {/* Appointments Modal */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in"
            style={{ animation: 'modalSlideIn 0.25s ease-out' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Appointments on{' '}
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h2>
                <p className="text-sm text-white/70 mt-0.5">
                  {modalAppointments.length} appointment{modalAppointments.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {modalAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No appointments on this date.</p>
                </div>
              ) : (
                modalAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="border border-gray-200 rounded-xl p-5 hover:border-blue-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      {/* Patient info */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{appointment.patientName}</h3>
                          <p className="text-xs text-gray-500">
                            {appointment.studentId?.studentId || 'N/A'} • {appointment.studentId?.year || 'N/A'}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {appointment.timeSlot}
                            </span>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">Symptoms:</span>{' '}
                              <span className="text-gray-600">{appointment.symptoms}</span>
                            </p>
                            {appointment.additionalNotes && (
                              <p className="text-sm mt-1">
                                <span className="font-medium text-gray-700">Notes:</span>{' '}
                                <span className="text-gray-500">{appointment.additionalNotes}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex flex-col items-end gap-2">
                        <span className={`badge ${getStatusBadge(appointment.status)}`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>

                        {appointment.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(appointment._id)}
                              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 rounded-lg"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(appointment._id)}
                              className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1 rounded-lg"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Feedback section */}
                    {appointment.feedback && (
                      <div className="mt-3 pt-3 border-t border-gray-100 bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium mb-1">Patient Feedback:</p>
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-500">{'★'.repeat(appointment.feedback.rating)}</span>
                          <span className="text-sm text-gray-600">{appointment.feedback.comment}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={closeModal}
                className="px-5 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline animation style */}
      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default DoctorAppointments;
