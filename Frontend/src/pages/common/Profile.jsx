import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { User, Mail, Phone, ShieldAlert, Save, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await authService.getProfile();
      setProfileData(res.data);
    } catch (error) {
      setErrorMsg('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      setErrorMsg('');
      const res = await authService.updateProfile(profileData);
      setProfileData(res.data);
      setMessage('Profile updated successfully.');
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to permanently delete your account? This cannot be undone.")) {
      try {
        await authService.deleteProfile();
        logout();
        navigate('/');
      } catch (error) {
        setErrorMsg(error.response?.data?.message || 'Failed to delete account.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{errorMsg || 'Profile not found'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">View and update your personal information</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-10 border-b border-gray-100">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-4xl font-bold shadow-inner">
              {profileData.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profileData.name}</h2>
              <div className="flex items-center text-gray-600 mt-1">
                <span className="capitalize bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mr-3">
                  {profileData.role.replace('_', ' ')}
                </span>
                <span className="flex items-center text-sm">
                  <Mail className="w-4 h-4 mr-1" /> {profileData.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          {message && (
            <div className="mb-6 p-4 bg-green-50 text-accent-dark rounded-lg flex items-center">
              {message}
            </div>
          )}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
              <ShieldAlert className="w-5 h-5 mr-2" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Common Fields */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    value={profileData.name || ''}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address (Read Only)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={profileData.email || ''}
                    readOnly
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone || ''}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Role-Specific Fields */}
              {profileData.role === 'student' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Student ID</label>
                    <input type="text" name="studentId" value={profileData.studentId || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Faculty</label>
                    <input type="text" name="faculty" value={profileData.faculty || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </>
              )}

              {profileData.role === 'doctor' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Medical Reg Number</label>
                    <input type="text" value={profileData.medicalRegNumber || ''} readOnly className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Specialization</label>
                    <input type="text" name="specialization" value={profileData.specialization || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Hospital</label>
                    <input type="text" name="hospitalName" value={profileData.hospitalName || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </>
              )}

              {profileData.role === 'shop_owner' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Shop Name</label>
                    <input type="text" name="shopName" value={profileData.shopName || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Shop Address</label>
                    <input type="text" name="shopAddress" value={profileData.shopAddress || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Business Type</label>
                    <select name="businessType" value={profileData.businessType || ''} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                      <option value="pharmacy">Pharmacy</option>
                      <option value="grocery">Grocery</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="stationary">Stationary</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <button
                type="button"
                onClick={handleDelete}
                className="w-full sm:w-auto px-6 py-2 text-red-600 bg-red-50 hover:bg-red-100 font-medium rounded-lg flex items-center justify-center transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </button>
              
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
