import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // In a real app, you'd fetch user profile here
      // For now, we'll decode the token or fetch from /api/auth/me
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({
        id: payload.id,
        _id: payload.id,
        role: payload.role,
        name: localStorage.getItem('userName') || '',
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    setUser(data.data.user);
    if(data.data.user?.name) localStorage.setItem('userName', data.data.user.name);
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    if (!data.pending) {
      setUser(data.data.user);
      if(data.data.user?.name) localStorage.setItem('userName', data.data.user.name);
    }
    return data;
  };

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem('userName');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDoctor: user?.role === 'doctor',
    isStudent: user?.role === 'student',
    isVendor: user?.role === 'shop_owner',
    isDelivery: user?.role === 'delivery_person',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
