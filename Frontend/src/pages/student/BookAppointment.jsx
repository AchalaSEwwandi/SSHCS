import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { healthService } from '../../services';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Calendar, Clock, User, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Define the validation schema using Zod
const appointmentSchema = z.object({
  patientName: z.string().min(2, "Patient name must be at least 2 characters").max(50, "Name is too long"),
  date: z.string().refine((val) => {
    const selectedDate = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Remove time portion from today
    return selectedDate >= today;
  }, { message: "Date cannot be in the past" }),
  timeSlot: z.string().min(1, "Please select a time slot"),
  symptoms: z.string().min(10, "Please describe your symptoms in at least 10 characters"),
  additionalNotes: z.string().max(200, "Notes cannot exceed 200 characters").optional()
});

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  // Initialize react-hook-form with Zod validation
  const { 
    register, 
    handleSubmit, 
    setValue,
    formState: { errors } 
  } = useForm({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientName: '',
      date: '',
      timeSlot: '',
      symptoms: '',
      additionalNotes: ''
    }
  });

  useEffect(() => {
    if (doctorId) fetchDoctor();
    // Pre-fill patient name from logged-in user context
    if (user && (user.name || user.id)) {
      setValue('patientName', user.name || '');
    }
  }, [doctorId, user, setValue]);

  const fetchDoctor = async () => {
    try {
      const result = await healthService.getDoctors();
      const doc = result.data.find((d) => d._id === doctorId);
      setDoctor(doc);
    } catch (error) {
      console.error('Failed to fetch doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    setApiError('');

    try {
      const studentId = user?._id || user?.id;

      if (!studentId) {
         setApiError('User identification failed. Please log out and log in again.');
         setSubmitting(false);
         return;
      }

      await healthService.createAppointment({
        ...data,
        doctorId,
        studentId,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/health/my-appointments');
      }, 2000);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-600">Doctor not found.</p>
        <button onClick={() => navigate('/health/doctors')} className="mt-4 btn-primary">
          Back to Doctors
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md py-12 mx-auto text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-full">
          <Calendar className="w-8 h-8 text-accent-dark" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Appointment Booked!</h2>
        <p className="text-gray-600">Your appointment has been scheduled successfully.</p>
        <p className="mt-4 text-sm text-gray-500">Redirecting to your appointments...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto ">
      <button onClick={() => navigate('/health/doctors')} className="flex items-center mb-6 text-blue-600 hover:text-sky-700">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Doctors
      </button>

      <div className="p-6 mb-6 card">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-20 h-20 bg-gray-200 rounded-full">
            <span className="text-3xl font-medium text-gray-600">
              {doctor.userId?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{doctor.userId?.name}</h1>
            <p className="font-medium text-blue-600">{doctor.specialization}</p>
            {doctor.userId?.hospitalName && (
              <p className="mt-1 text-gray-600">{doctor.userId.hospitalName}</p>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 card">
        <h2 className="text-xl font-semibold">Book Appointment</h2>

        {apiError && (
          <div className="flex items-center px-4 py-3 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">
            <AlertCircle className="w-4 h-4 mr-2"/>
            {apiError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Patient Name */}
          <div>
            <label className="form-label">Patient Name *</label>
            <div className="relative">
              <input
                type="text"
                {...register('patientName')}
                className={`pl-10 input ${errors.patientName ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter patient full name"
              />
              <User className={`absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 ${errors.patientName ? 'text-red-400' : 'text-gray-400'}`} />
            </div>
            {errors.patientName && <p className="mt-1 text-xs text-red-500">{errors.patientName.message}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="form-label">Date *</label>
            <div className="relative">
              <input
                type="date"
                {...register('date')}
                min={today}
                className={`pl-10 input ${errors.date ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              <Calendar className={`absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 ${errors.date ? 'text-red-400' : 'text-gray-400'}`} />
            </div>
            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
          </div>

          {/* Symptoms */}
          <div className="md:col-span-2">
            <label className="form-label">Symptoms / Reason for Visit *</label>
            <textarea
              {...register('symptoms')}
              className={`textarea ${errors.symptoms ? 'border-red-500 focus:ring-red-500' : ''}`}
              rows={3}
              placeholder="Describe your symptoms or reason for consultation (min 10 chars)..."
            />
            {errors.symptoms && <p className="mt-1 text-xs text-red-500">{errors.symptoms.message}</p>}
          </div>

          {/* Time Slot */}
          <div>
            <label className="form-label">Preferred Time Slot *</label>
            <div className="relative">
              <select
                {...register('timeSlot')}
                className={`pl-10 select ${errors.timeSlot ? 'border-red-500 focus:ring-red-500' : ''}`}
              >
                <option value="">Select time slot</option>
                <option value="09:00-10:00">09:00 - 10:00</option>
                <option value="10:00-11:00">10:00 - 11:00</option>
                <option value="11:00-12:00">11:00 - 12:00</option>
                <option value="14:00-15:00">14:00 - 15:00</option>
                <option value="15:00-16:00">15:00 - 16:00</option>
                <option value="16:00-17:00">16:00 - 17:00</option>
              </select>
              <Clock className={`absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 ${errors.timeSlot ? 'text-red-400' : 'text-gray-400'}`} />
            </div>
            {errors.timeSlot && <p className="mt-1 text-xs text-red-500">{errors.timeSlot.message}</p>}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="form-label">Additional Notes</label>
            <input
              type="text"
              {...register('additionalNotes')}
              className={`input ${errors.additionalNotes ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Any additional information..."
            />
            {errors.additionalNotes && <p className="mt-1 text-xs text-red-500">{errors.additionalNotes.message}</p>}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 btn-primary"
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                Booking...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                Book Appointment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookAppointment;
