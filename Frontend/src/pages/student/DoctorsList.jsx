import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { healthService } from '../../services';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import RatingStars from '../../components/common/RatingStars';
import { Calendar, Mail, Phone, Stethoscope } from 'lucide-react';

const DoctorsList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const result = await healthService.getDoctors();
      setDoctors(result.data);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSpecialty = !selectedSpecialty || doctor.specialization === selectedSpecialty;
    const matchesSearch =
      !searchTerm ||
      doctor.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });

  const specialties = [...new Set(doctors.map((d) => d.specialization).filter(Boolean))];

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
          <h1 className="text-3xl font-bold text-gray-900">Find Doctors</h1>
          <p className="text-gray-600 mt-2">Connect with qualified medical professionals</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Search</label>
            <input
              type="text"
              placeholder="Search by name or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="form-label">Specialty</label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="select"
            >
              <option value="">All Specialties</option>
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Stethoscope className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No doctors found matching your criteria.</p>
          </div>
        ) : (
          filteredDoctors.map((doctor) => (
            <div key={doctor._id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  {doctor.userId?.avatar ? (
                    <img
                      src={doctor.userId.avatar}
                      alt={doctor.userId.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-medium text-gray-600">
                      {doctor.userId?.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{doctor.userId?.name}</h3>
                  <p className="text-sm text-blue-600">{doctor.specialization}</p>
                  {doctor.userId?.hospitalName && (
                    <p className="text-sm text-gray-600 mt-1">{doctor.userId.hospitalName}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <RatingStars rating={doctor.rating || 0} size="sm" showValue />
                    <span className="text-sm text-gray-500">({doctor.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {doctor.userId?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{doctor.userId.phone}</span>
                  </div>
                )}
                {doctor.userId?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{doctor.userId.email}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <Link
                  to={`/health/book-appointment/${doctor._id}`}
                  className="btn-primary w-full justify-center"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Appointment
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DoctorsList;
