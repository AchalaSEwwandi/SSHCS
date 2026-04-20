import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { Mail, Lock, Eye, EyeOff, KeyRound, CheckCircle, ArrowLeft } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // View modes: 'login', 'forgot', 'verify', 'reset', 'success'
  const [viewMode, setViewMode] = useState('login');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: '',
    newPassword: '',
  });
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setMessage('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await login(formData.email, formData.password);
      const userRole = res?.data?.user?.role;

      let defaultPath = '/student/dashboard';
      if (userRole === 'doctor') defaultPath = '/doctor/dashboard';
      else if (userRole === 'shop_owner') defaultPath = '/vendor/dashboard';
      else if (userRole === 'delivery_person') defaultPath = '/delivery/dashboard';
      else if (userRole === 'admin') defaultPath = '/admin/dashboard';

      const finalDest = defaultPath;
      navigate(finalDest, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword(formData.email);
      setMessage('OTP sent to your email.');
      setViewMode('verify');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authService.verifyOTP(formData.email, formData.otp);
      setResetToken(res.data.resetToken);
      setMessage('OTP verified! Enter your new password.');
      setViewMode('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.resetPassword(resetToken, formData.newPassword);
      setMessage('Password reset successfully!');
      setViewMode('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-br from-white to-gray-50 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        
        {viewMode === 'login' && (
          <div className="fade-in">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-lg bg-gradient-to-br from-blue-900 to-blue-600">
                <span className="text-xl font-bold text-white">SS</span>
              </div>
              <h2 className="mt-6 text-3xl font-bold text-gray-900">Sign in to SSHCS</h2>
              <p className="mt-2 text-sm text-gray-600">
                Smart Student Health & Career Support System
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
              {error && (
                <div className="px-4 py-3 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">
                  {error}
                </div>
              )}
              {message && (
                <div className="px-4 py-3 text-sm text-accent-dark border border-accent/20 rounded-lg bg-green-50">
                  {message}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="form-label">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 input"
                      placeholder="Enter your email"
                    />
                    <Mail className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 pr-10 input"
                      placeholder="Enter your password"
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
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => { setViewMode('forgot'); setError(''); setMessage(''); }}
                    className="font-medium transition-colors text-blue-600 hover:text-blue-600"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-base font-medium btn-primary"
              >
                {loading ? (
                  <div className="w-5 h-5 mx-auto border-b-2 border-white rounded-full animate-spin"></div>
                ) : (
                  'Sign in'
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-medium transition-colors text-blue-600 hover:text-blue-600"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        )}

        {viewMode === 'forgot' && (
          <div className="fade-in">
            <button onClick={() => setViewMode('login')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
            <p className="mt-2 text-sm text-gray-600">Enter your email to receive an OTP.</p>
            <form className="mt-6 space-y-6" onSubmit={handleForgotSubmit}>
              {error && <div className="px-4 py-3 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">{error}</div>}
              <div>
                <label className="form-label">Email address</label>
                <div className="relative">
                  <input 
                    name="email" 
                    type="email" 
                    required 
                    value={formData.email} 
                    onChange={handleChange} 
                    className="pl-10 input" 
                    placeholder="Enter your email" 
                  />
                  <Mail className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 text-base font-medium btn-primary">
                {loading ? <div className="w-5 h-5 mx-auto border-b-2 border-white rounded-full animate-spin"></div> : 'Send OTP'}
              </button>
            </form>
          </div>
        )}

        {viewMode === 'verify' && (
          <div className="fade-in">
            <button onClick={() => setViewMode('forgot')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Verify OTP</h2>
            <p className="mt-2 text-sm text-gray-600">We sent a 6-digit code to <span className="font-semibold">{formData.email}</span>.</p>
            <form className="mt-6 space-y-6" onSubmit={handleVerifySubmit}>
              {error && <div className="px-4 py-3 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">{error}</div>}
              {message && <div className="px-4 py-3 text-sm text-accent-dark border border-accent/20 rounded-lg bg-green-50">{message}</div>}
              <div>
                <label className="form-label">Enter OTP</label>
                <div className="relative">
                  <input 
                    name="otp" 
                    type="text" 
                    required 
                    value={formData.otp} 
                    onChange={handleChange} 
                    className="pl-10 input tracking-widest font-mono text-center text-lg" 
                    placeholder="000000" 
                  />
                  <KeyRound className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 text-base font-medium btn-primary">
                {loading ? <div className="w-5 h-5 mx-auto border-b-2 border-white rounded-full animate-spin"></div> : 'Verify OTP'}
              </button>
            </form>
          </div>
        )}

        {viewMode === 'reset' && (
          <div className="fade-in">
            <h2 className="text-2xl font-bold text-gray-900">New Password</h2>
            <p className="mt-2 text-sm text-gray-600">Please create a new password that you don't use on any other site.</p>
            <form className="mt-6 space-y-6" onSubmit={handleResetSubmit}>
              {error && <div className="px-4 py-3 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">{error}</div>}
              {message && <div className="px-4 py-3 text-sm text-accent-dark border border-accent/20 rounded-lg bg-green-50">{message}</div>}
              <div>
                <label className="form-label">New Password</label>
                <div className="relative">
                  <input 
                    name="newPassword" 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    minLength="6" 
                    value={formData.newPassword} 
                    onChange={handleChange} 
                    className="pl-10 pr-10 input" 
                    placeholder="Enter new password" 
                  />
                  <Lock className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute text-gray-400 -translate-y-1/2 right-3 top-1/2 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 text-base font-medium btn-primary">
                {loading ? <div className="w-5 h-5 mx-auto border-b-2 border-white rounded-full animate-spin"></div> : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {viewMode === 'success' && (
          <div className="text-center fade-in py-8">
            <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">All done!</h2>
            <p className="mt-2 text-sm text-gray-600 mb-8">Your password has been reset successfully.</p>
            <button 
              onClick={() => { setViewMode('login'); setFormData({ email: '', password: '', otp: '', newPassword: '' }); setMessage(''); }} 
              className="w-full py-3 text-base font-medium btn-primary"
            >
              Return to Login
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;
