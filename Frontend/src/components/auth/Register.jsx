import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, Phone, Eye, EyeOff, GraduationCap, Stethoscope, Store } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'student',
    // Student
    studentId: '',
    year: '',
    semester: '',
    faculty: '',
    // Doctor
    nic: '',
    medicalRegNumber: '',
    specialization: '',
    yearsOfExperience: '',
    hospitalName: '',
    // Vendor
    shopName: '',
    businessType: '',
    shopAddress: '',
    // Files
    avatar: null,
    medicalLicenseFile: null,
    businessLicenseFile: null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    if (e.target.type === 'file') {
      setFormData({ ...formData, [e.target.name]: e.target.files[0] || null });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
    setError('');
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
        setError('Please fill in all required fields');
        return;
      }
      
      const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
      if (!strongPasswordRegex.test(formData.password)) {
        setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Step 2 Form Validations Before Submit
    if (!formData.phone || formData.phone.length < 10) {
      setError('Please enter a valid phone number (at least 10 digits)');
      setLoading(false);
      return;
    }

    if (formData.role === 'student' && !formData.studentId) {
       setError('Student ID is required');
       setLoading(false); return;
    }
    if (formData.role === 'doctor' && (!formData.nic || !formData.medicalRegNumber)) {
       setError('NIC and Medical Registration Number are required');
       setLoading(false); return;
    }
    if (formData.role === 'shop_owner' && (!formData.shopName || !formData.businessType)) {
       setError('Shop Name and Business Type are required');
       setLoading(false); return;
    }

    try {
      const payload = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === 'confirmPassword') return;
        if (formData[key] !== null && formData[key] !== undefined) {
          payload.append(key, formData[key]);
        }
      });

      const result = await register(payload);

      if (result.pending) {
        // Show pending approval message
        alert('Registration submitted! Your account is pending admin approval. You will be notified by email once approved.');
      }

      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-br from-white to-gray-50 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-lg bg-gradient-to-br from-blue-900 to-blue-600">
            <span className="text-xl font-bold text-white">SS</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join SSHCS - Smart Student Health & Career Support System
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="px-4 py-3 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">
              {error}
            </div>
          )}

          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-6 space-x-2">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= s
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s}
                </div>
                {s < 2 && (
                  <div
                    className={`w-12 h-1 ${step > s ? 'bg-blue-500' : 'bg-gray-200'}`}
                  ></div>
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Full Name *</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10 input"
                      placeholder="Enter your full name"
                    />
                    <User className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                  </div>
                </div>

                <div>
                  <label className="form-label">Email Address *</label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 input"
                      placeholder="Enter your email"
                    />
                    <Mail className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                  </div>
                </div>

                <div>
                  <label className="form-label">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="pl-10 input"
                      placeholder="Enter your phone number"
                    />
                    <Phone className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                  </div>
                </div>

                <div>
                  <label className="form-label">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 pr-10 input"
                      placeholder="Create a password (min. 6 characters)"
                    />
                    <Lock className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute text-gray-400 -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label">Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-10 input"
                      placeholder="Re-enter your password"
                    />
                    <Lock className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <div></div>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 btn-primary"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="form-label">Profile Image (Avatar) - Optional</label>
                <input
                  type="file"
                  name="avatar"
                  onChange={handleChange}
                  className="input p-2"
                  accept="image/*"
                />
              </div>

              <div>
                <label className="form-label">I am registering as: *</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'student', icon: GraduationCap, label: 'Student' },
                    { value: 'doctor', icon: Stethoscope, label: 'Doctor' },
                    { value: 'shop_owner', icon: Store, label: 'Vendor' },
                  ].map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: value })}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${
                        formData.role === value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Student-specific fields */}
              {formData.role === 'student' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="form-label">Student ID</label>
                    <input
                      type="text"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      className="input"
                      placeholder="e.g., IT20201234"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Year</label>
                      <select
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        className="select"
                      >
                        <option value="">Select Year</option>
                        <option value="1">Year 1</option>
                        <option value="2">Year 2</option>
                        <option value="3">Year 3</option>
                        <option value="4">Year 4</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Semester</label>
                      <select
                        name="semester"
                        value={formData.semester}
                        onChange={handleChange}
                        className="select"
                      >
                        <option value="">Select Semester</option>
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Faculty</label>
                    <input
                      type="text"
                      name="faculty"
                      value={formData.faculty}
                      onChange={handleChange}
                      className="input"
                      placeholder="e.g., Computing"
                    />
                  </div>
                </div>
              )}

              {/* Doctor-specific fields */}
              {formData.role === 'doctor' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="form-label">Medical Council NIC Number *</label>
                    <input
                      type="text"
                      name="nic"
                      value={formData.nic}
                      onChange={handleChange}
                      className="input"
                      placeholder="e.g., 123456789V"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Medical Registration Number *</label>
                    <input
                      type="text"
                      name="medicalRegNumber"
                      value={formData.medicalRegNumber}
                      onChange={handleChange}
                      className="input"
                      placeholder="e.g., SLMC-12345"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Specialization *</label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="input"
                      placeholder="e.g., Cardiology, Dermatology"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Years of Experience</label>
                      <input
                        type="number"
                        name="yearsOfExperience"
                        value={formData.yearsOfExperience}
                        onChange={handleChange}
                        className="input"
                        placeholder="e.g., 5"
                      />
                    </div>
                    <div>
                      <label className="form-label">Hospital/Clinic Name</label>
                      <input
                        type="text"
                        name="hospitalName"
                        value={formData.hospitalName}
                        onChange={handleChange}
                        className="input"
                        placeholder="e.g., National Hospital"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Medical License File</label>
                    <input
                      type="file"
                      name="medicalLicenseFile"
                      onChange={handleChange}
                      className="input"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <p className="mt-1 text-sm text-gray-500">Upload your medical license (PDF, JPG, PNG)</p>
                  </div>
                </div>
              )}

              {/* Vendor-specific fields */}
              {formData.role === 'shop_owner' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="form-label">Shop Name *</label>
                    <input
                      type="text"
                      name="shopName"
                      value={formData.shopName}
                      onChange={handleChange}
                      className="input"
                      placeholder="e.g., Campus Grocery"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Business Type *</label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      className="select"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="pharmacy">Pharmacy</option>
                      <option value="grocery">Grocery Store</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Shop Address</label>
                    <input
                      type="text"
                      name="shopAddress"
                      value={formData.shopAddress}
                      onChange={handleChange}
                      className="input"
                      placeholder="e.g., Main Building, Ground Floor"
                    />
                  </div>
                  <div>
                    <label className="form-label">NIC Number</label>
                    <input
                      type="text"
                      name="nic"
                      value={formData.nic}
                      onChange={handleChange}
                      className="input"
                      placeholder="e.g., 123456789V"
                    />
                  </div>
                  <div>
                    <label className="form-label">Business License File</label>
                    <input
                      type="file"
                      name="businessLicenseFile"
                      onChange={handleChange}
                      className="input"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <p className="mt-1 text-sm text-gray-500">Upload your business license (optional)</p>
                  </div>
                </div>
              )}

              
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 btn-outline"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 btn-primary"
              >
                {loading ? (
                  <div className="w-5 h-5 mx-auto border-b-2 border-white rounded-full animate-spin"></div>
                ) : (
                  'Register'
                )}
              </button>
            </div>
            </>
          )}
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium transition-colors text-blue-600 hover:text-blue-600"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
