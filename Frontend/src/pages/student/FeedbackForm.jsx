import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { feedbackService, healthService, orderService, shopService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import RatingStars from '../../components/common/RatingStars';
import { Star, MessageSquare, Send } from 'lucide-react';

const FeedbackForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const appointmentId = searchParams.get('appointment');
  const orderId = searchParams.get('order');

  const [formData, setFormData] = useState({
    userId: '', 
    targetType: 'doctor',
    targetId: '',
    appointmentId: appointmentId || '',
    orderId: orderId || '',
    rating: 5,
    comment: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch target info if appointmentId provided
  const [targetName, setTargetName] = useState('');
  
  // For manual selection
  const [isManualSelection, setIsManualSelection] = useState(!appointmentId && !orderId);
  const [doctorsList, setDoctorsList] = useState([]);
  const [shopsList, setShopsList] = useState([]);

  useEffect(() => {
    if (user && (user._id || user.id)) {
      setFormData(prev => ({ ...prev, userId: user._id || user.id }));
      if (appointmentId) {
        fetchAppointmentDetails(user._id || user.id);
      } else if (orderId) {
        fetchOrderDetails(orderId);
      } else if (isManualSelection) {
        fetchDoctorsAndShops();
      }
    }
  }, [appointmentId, orderId, user, isManualSelection]);

  const fetchDoctorsAndShops = async () => {
    try {
      setLoading(true);
      const [doctorsRes, shopsRes] = await Promise.all([
        healthService.getDoctors(),
        shopService.getShops()
      ]);
      setDoctorsList(doctorsRes.data || []);
      setShopsList(shopsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (id) => {
    try {
      const result = await orderService.getOrderTracking(id);
      const order = result.data;
      // Support both shopId/shopName and storeId/storeName
      let shopId = order.shopId || order.storeId || null;
      const shopName = order.shopName || order.storeName || '';

      // Fallback: if shopId is null but shopName exists, look up from shops list
      if (!shopId && shopName) {
        try {
          const shopsRes = await shopService.getShops();
          const shops = shopsRes.data || [];
          const matchedShop = shops.find(
            (s) =>
              (s.shopName || s.name || '').toLowerCase() === shopName.toLowerCase()
          );
          if (matchedShop) {
            shopId = matchedShop._id;
          }
        } catch {
          // Silently ignore shop lookup failure
        }
      }

      if (order && shopId) {
        setFormData((prev) => ({
          ...prev,
          targetId: shopId,
          targetType: 'shop',
          orderId: order.orderId || id,
        }));
        setTargetName(`${shopName || 'Shop'}`);
      } else if (order) {
        // Still allow feedback even without a resolved shop - use orderId as reference
        // and set targetType to 'shop' with a fallback
        setFormData((prev) => ({
          ...prev,
          targetType: 'shop',
          orderId: order.orderId || id,
        }));
        setTargetName(shopName || 'Shop');
        // Switch to manual selection so user can pick the shop
        setIsManualSelection(true);
        fetchDoctorsAndShops();
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      setError('Failed to load order details. Please try again.');
    }
  };

  const fetchAppointmentDetails = async (studentId) => {
    try {
      const result = await healthService.getStudentAppointments(studentId);
      const appointment = result.data?.find((a) => a._id === appointmentId);
      
      if (appointment) {
        const docId = appointment.doctorId?._id || appointment.doctorId;
        
        setFormData((prev) => ({
          ...prev,
          targetId: docId,
          targetType: 'doctor',
          appointmentId: appointment._id
        }));
        
        const docName = appointment.doctorId?.userId?.name || 'Doctor';
        setTargetName(`${docName}`);
      } else {
        console.warn('Appointment not found with ID:', appointmentId);
    }
    } catch{}
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'targetType') {
      setFormData({
        ...formData,
        targetType: value,
        targetId: ''
      });
      setError('');
    } else {
      setFormData({ ...formData, [name]: value });
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Ensure all critical fields are present before submitting
    const finalData = {
      ...formData,
      userId: formData.userId || user?._id || user?.id,
    };

    if (!finalData.targetId) {
      setError('Still loading recipient info or missing target ID. Please wait a moment and try again.');
      setLoading(false);
      return;
    }

    try {
      await feedbackService.submitFeedback(finalData);
      setSuccess(true);
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    }
  }
  if (success) {
    return (
      <div className="max-w-md py-12 mx-auto text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10">
          <Star className="w-8 h-8 text-accent-dark" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Thank You!</h2>
        <p className="text-gray-600">Your feedback has been submitted successfully.</p>
        <p className="mt-4 text-sm text-gray-500">Returning...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Submit Feedback</h1>
        <p className="mt-2 text-gray-600">Share your experience to help us improve</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 card">
        {error && (
          <div className="px-4 py-3 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">
            {error}
          </div>
        )}

        {isManualSelection && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="form-label">Feedback Target Type *</label>
              <select
                name="targetType"
                value={formData.targetType}
                onChange={handleChange}
                className="select"
                required
              >
                <option value="doctor">Doctor</option>
                <option value="shop">Shop</option>
              </select>
            </div>
            <div>
              <label className="form-label">Select {formData.targetType === 'doctor' ? 'Doctor' : 'Shop'} *</label>
              <select
                name="targetId"
                value={formData.targetId}
                onChange={handleChange}
                className="select"
                required
              >
                <option value="">-- Choose One --</option>
                {formData.targetType === 'doctor'
                  ? doctorsList.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.userId?.name || 'Doctor'}
                      </option>
                    ))
                  : shopsList.map((shop) => (
                      <option key={shop._id} value={shop._id}>
                        {shop.shopName || shop.name}
                      </option>
                    ))}
              </select>
            </div>
          </div>
        )}

        {/* Rating */}
        <div>
          <label className="form-label">Rating *</label>
          <div className="flex items-center gap-4">
            <RatingStars
              rating={formData.rating}
              onChange={(rating) => setFormData({ ...formData, rating })}
              size="lg"
            />
            <span className="text-sm text-gray-600">
              {formData.rating === 5 && 'Excellent'}
              {formData.rating === 4 && 'Very Good'}
              {formData.rating === 3 && 'Good'}
              {formData.rating === 2 && 'Fair'}
              {formData.rating === 1 && 'Poor'}
            </span>
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="form-label">Your Feedback *</label>
          <div className="relative">
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              rows={5}
              className="p-2 border textarea"
              placeholder="Tell us about your experience... What went well? What could be improved?"
              required
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Your feedback will be automatically analyzed for sentiment to help us understand your experience.
          </p>
        </div>

        {/* Target info (read-only) */}
        {!isManualSelection && targetName && (
          <div className="p-4 rounded-lg bg-gray-50">
            <p className="mb-1 text-sm font-medium text-gray-700">Providing feedback for:</p>
            <p className="text-gray-900">{targetName}</p>
          </div>
        )}

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
            disabled={loading || !formData.comment.trim()}
            className="flex items-center gap-2 btn-primary"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Feedback
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;
