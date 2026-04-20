import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { healthService, shopService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FileText, Download, Eye, Upload, X } from 'lucide-react';

const Prescriptions = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedAppointmentId = searchParams.get('appointment');

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [shops, setShops] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [selectedAppointment, setSelectedAppointment] = useState('');
  const [selectedShop, setSelectedShop] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchPrescriptions();
  }, [user]);

  // Auto-open modal when appointment query param is present
  useEffect(() => {
    if (preselectedAppointmentId && !loading) {
      setIsModalOpen(true);
    }
  }, [preselectedAppointmentId, loading]);

  useEffect(() => {
    if (isModalOpen) {
      fetchUploadData();
    }
  }, [isModalOpen]);

  const fetchPrescriptions = async () => {
    const studentId = user?._id || user?.id;
    if (!studentId) {
      setLoading(false);
      return;
    }
    try {
      const result = await healthService.getStudentPrescriptions(studentId);
      setPrescriptions(result.data || []);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUploadData = async () => {
    const studentId = user?._id || user?.id;
    if (!studentId) return;

    try {
      const [appointmentsRes, shopsRes] = await Promise.all([
        healthService.getStudentAppointments(studentId),
        shopService.getShops()
      ]);

      // Filter for approved appointments that don't already have a prescription
      // In the real flow, the doctor sets the appointment to "approved" or "completed" after seeing the patient
      const existingApptIds = prescriptions.map(p => p.appointmentId?._id);
      const availableAppointments = appointmentsRes.data.filter(
        app => app.status === 'approved' && !existingApptIds.includes(app._id)
      );

      setAppointments(availableAppointments);
      setShops(shopsRes.data || []);

      // Auto-select the preselected appointment if it exists in the available list
      if (preselectedAppointmentId) {
        const matchFound = availableAppointments.some(app => app._id === preselectedAppointmentId);
        if (matchFound) {
          setSelectedAppointment(preselectedAppointmentId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch modal data:', error);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedAppointment || !selectedShop || !file) {
      alert('Please fill all required fields and upload a file.');
      return;
    }

    const studentId = user?._id || user?.id;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('appointmentId', selectedAppointment);
    formData.append('pharmacyId', selectedShop);
    formData.append('studentId', studentId);

    setUploading(true);
    try {
      await healthService.uploadPrescription(formData);
      setIsModalOpen(false);
      setSelectedAppointment('');
      setSelectedShop('');
      setFile(null);
      fetchPrescriptions();
      alert('Prescription uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error.response?.data?.message || 'Failed to upload prescription');
    } finally {
      setUploading(false);
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
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-gray-600 mt-2">View and upload your medical prescriptions to pharmacies</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <Upload className="w-5 h-5 mr-2" />
          Upload Prescription
        </button>
      </div>

      {prescriptions.length === 0 ? (
        <div className="card card-body p-12 text-center text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2">No Prescriptions Yet</h3>
          <p className="mb-6">Upload your prescription document from a completed appointment to submit it to a campus pharmacy.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary inline-flex items-center mx-auto"
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <div key={prescription._id} className="card p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Prescription for {prescription.appointmentId?.doctorId?.userId?.name ? ` ${prescription.appointmentId.doctorId.userId.name}` : 'Appointment'}
                      </h3>
                      <span className={`badge ${getStatusBadge(prescription.status)}`}>
                        {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">Appointment ID:</span> {prescription.appointmentId?._id?.slice(-6) || 'N/A'}
                      </p>
                      <p>
                        <span className="font-medium">Pharmacy:</span> {prescription.pharmacyId?.name || prescription.pharmacyId?.shopName || 'Unknown Pharmacy'}
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
                    className="btn-outline text-sm py-2 px-4 flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View File
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Upload Prescription</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFile(null);
                  setSelectedAppointment('');
                  setSelectedShop('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Appointment
                </label>
                <select
                  value={selectedAppointment}
                  onChange={(e) => setSelectedAppointment(e.target.value)}
                  required
                  className="w-full input-field border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">-- Choose an appointment --</option>
                  {appointments.map(app => (
                    <option key={app._id} value={app._id}>
                      {new Date(app.date).toLocaleDateString()} -  {app.doctorId?.userId?.name || 'Unknown Doctor'}
                    </option>
                  ))}
                </select>
                {appointments.length === 0 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    You have no available past/approved appointments without prescriptions.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Pharmacy
                </label>
                <select
                  value={selectedShop}
                  onChange={(e) => setSelectedShop(e.target.value)}
                  required
                  className="w-full input-field border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">-- Choose a pharmacy/vendor --</option>
                  {shops.map(shop => (
                    <option key={shop._id} value={shop._id}>
                      {shop.name} {shop.shopName ? `(${shop.shopName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prescription File (PDF/Image)
                </label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-outline text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedAppointment || !selectedShop || !file}
                  className={`btn-primary px-4 py-2 rounded-lg text-white font-medium min-w-[120px] flex justify-center items-center ${uploading || !selectedAppointment || !selectedShop || !file ? 'opacity-50 cursor-not-allowed bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {uploading ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    'Upload'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prescriptions;
