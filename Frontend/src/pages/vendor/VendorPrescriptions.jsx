import { useState, useEffect } from 'react';
import { healthService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FileText, CheckCircle, XCircle } from 'lucide-react';

const VendorPrescriptions = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, [user]);

  const fetchPrescriptions = async () => {
    const pharmacyId = user?._id || user?.id;
    if (!pharmacyId) {
      setLoading(false);
      return;
    }
    try {
      const result = await healthService.getPharmacyPrescriptions(pharmacyId);
      setPrescriptions(result.data || []);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
    } finally {
      setLoading(false);
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
    // If securely saved as frontend URL, rewrite to backend URL (local development hotfix)
    if (url.includes('localhost:517') || url.includes('localhost:3000')) {
      const parts = url.split('/uploads/');
      return `http://localhost:5000/uploads/${parts[1]}`;
    }
    return url;
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
        <h1 className="text-3xl font-bold text-gray-900">Prescriptions Queue</h1>
        <p className="mt-2 text-gray-600">Manage incoming prescription orders</p>
      </div>

      {prescriptions.length === 0 ? (
        <div className="p-12 text-center card card-body">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="mb-2 text-lg font-semibold">No Prescriptions Found</h3>
          <p className="text-gray-600">
            There are currently no prescriptions waiting for your review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <div key={prescription._id} className="p-6 card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Patient: {prescription.studentId?.name}
                      </h3>
                      <span className={`badge ${getStatusBadge(prescription.status)}`}>
                        {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Doctor:</span> Dr. {prescription.appointmentId?.doctorId?.userId?.name}
                      </p>
                      <p>
                        <span className="font-medium">Uploaded:</span>{' '}
                        {new Date(prescription.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={getFileUrl(prescription.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm btn-outline"
                  >
                    View File
                  </a>
                  {prescription.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(prescription._id)}
                        className="flex items-center text-sm btn-primary"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(prescription._id)}
                        className="flex items-center text-sm text-red-600 border-red-200 btn-outline hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </button>
                    </>
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

export default VendorPrescriptions;
