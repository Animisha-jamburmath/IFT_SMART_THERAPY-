import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getToken } from '../../services/storage/token';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || !getToken()) navigate('/');
      else setChecking(false);
    }
  }, [loading, user, navigate]);

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !getToken()) return null;
  return children;
};

export default ProtectedRoute;