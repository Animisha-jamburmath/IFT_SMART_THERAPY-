import React, { createContext, useState, useContext, useEffect } from 'react';
import { getToken, removeToken } from '../services/storage/token';
import { getCurrentUser, login as apiLogin, logout as apiLogout } from '../services/api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = getToken();
      if (!token) { setLoading(false); return; }
      try {
        const u = await getCurrentUser();
        setUser(u);
      } catch { removeToken(); }
      finally { setLoading(false); }
    };
    loadUser();
  }, []);

  const login = async (username, password) => {
    await apiLogin(username, password);
    const u = await getCurrentUser();
    setUser(u);
    return u;
  };

  const logout = () => { apiLogout(); setUser(null); };

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);