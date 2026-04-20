import { useState, useEffect } from 'react';
import { healthService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FileText, Eye, CheckCircle, XCircle } from 'lucide-react';

const DoctorPrescriptions = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchPrescriptions = async () => {
      const doctorId = user?._id || user?.id;
      if (!doctorId) {
        setLoading(false);
        return;
      }
      try {
        const result = await healthService.getDoctorPrescriptions(doctorId);
        setAppointmentsCallback(result.data || []);
      } catch (error) {
        console.error('Failed to fetch prescriptions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrescriptions();
  }, [user]);

  const setAppointmentsCallback = (data) => setPrescriptions(data);

  const fetchPrescriptions = async () => {
    const doctorId = user?._id || user?.id;
    if (!doctorId) return;
    try {
      const result = await healthService.getDoctorPrescriptions(doctorId);
      setPrescriptions(result.data || []);
    } catch (error) {
      console.error('Failed to update prescriptions:', error);
    }
  };

  const handleApprove = async (prescriptionId) => {
    try {
      await healthService.approvePrescription(prescriptionId);
      fetchPrescriptions();
    } catch (error) {
      alert('Failed to approve prescription');
    }
  };

  const handleReject = async (prescriptionId) => {
    try {
      await healthService.rejectPrescription(prescriptionId);
      fetchPrescriptions();
    } catch (error) {
      alert('Failed to reject prescription');
    }
  };

  const filteredPrescriptions = filter === 'all'
    ? prescriptions
    : prescriptions.filter((p) => p.status === filter);

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'badge-warning',
      accepted: 'badge-success',
      rejected: 'badge-danger',
    };
    return statusClasses[status] || 'badge-info';
  };

  const getFileUrl = (url) => {
    if (!url) return '#';
    // If securely saved as frontend URL, rewrite to backend URL
    if (url.includes('localhost:517') || url.includes('localhost:3000')) {
      const parts = url.split('/uploads/');
      return `http://localhost:5000/uploads/${parts[1]}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-gray-600 mt-2">Review and manage student prescriptions</p>
        </div>

        <div className="flex gap-2">
          {['all', 'pending', 'accepted', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredPrescriptions.length === 0 ? (
        <div className="card card-body p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2">No Prescriptions</h3>
          <p className="text-gray-600">
            {filter === 'all' ? 'No prescriptions uploaded yet.' : `No ${filter} prescriptions.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPrescriptions.map((prescription) => (
            <div key={prescription._id} className="card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Prescription for {prescription.studentId?.name}</h3>
                    <p className="text-sm text-gray-600">
                      Student ID: {prescription.studentId?.studentId || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Uploaded: {new Date(prescription.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Appointment with Dr. {prescription.appointmentId?.doctorId?.userId?.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`badge ${getStatusBadge(prescription.status)}`}>
                    {prescription.status}
                  </span>

                  {prescription.status === 'pending' && (
                    <>
                      <a
                        href={getFileUrl(prescription.fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline text-sm py-2 px-4 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </a>
                      <button
                        onClick={() => handleApprove(prescription._id)}
                        className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(prescription._id)}
                        className="btn-danger text-sm py-2 px-4 flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}

                  {prescription.status !== 'pending' && (
                    <a
                      href={getFileUrl(prescription.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline text-sm py-2 px-4 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorPrescriptions;
