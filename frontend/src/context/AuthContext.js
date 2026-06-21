import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem('tasknova_user');
      const token = localStorage.getItem('accessToken');
      if (savedUser && token) {
        try {
          setUser(JSON.parse(savedUser));
          const { data } = await api.get('/api/auth/me');
          setUser(data.user);
          localStorage.setItem('tasknova_user', JSON.stringify(data.user));
        } catch (e) {
          console.error('Session validation failed:', e);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // Real step 1: Login entry
  const loginStep1 = async (email, password) => {
    await api.post('/api/auth/login', { email, password });
    return {
      email
    };
  };

  // Real step 2: Verification of OTP / 2FA Code
  const verifyLogin = async (code, tempSession) => {
    const response = await api.post('/api/auth/2fa/verify', { email: tempSession.email, code });

    const { accessToken, refreshToken, user: loggedUser } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('tasknova_user', JSON.stringify(loggedUser));

    setUser(loggedUser);
    return loggedUser;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setUser(null);
      localStorage.removeItem('tasknova_user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  };

  const resetPassword = async (newPassword) => {
    const { data } = await api.put('/api/auth/reset-password', { newPassword });
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, mustResetPassword: false };
      localStorage.setItem('tasknova_user', JSON.stringify(updated));
      return updated;
    });
    return data;
  };

  // Switch role client-side (dev convenience)
  const switchRole = (role) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, role };
      localStorage.setItem('tasknova_user', JSON.stringify(updated));
      return updated;
    });
  };

  const updateProfile = async (profileData) => {
    const { data } = await api.put('/api/auth/profile', profileData);
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data.user };
      localStorage.setItem('tasknova_user', JSON.stringify(updated));
      return updated;
    });
    return data.user;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      loginStep1, 
      verifyLogin, 
      logout, 
      switchRole, 
      updateProfile,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
