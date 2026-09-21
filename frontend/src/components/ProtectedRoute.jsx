import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';

function ProtectedRoute({ children }) {
  const [authorized, setAuthorized] = useState(null);
  const token = sessionStorage.getItem('scholarflow_token');

  useEffect(() => {
    if (!token) {
      setAuthorized(false);
      return;
    }

    api.get('/auth/session')
      .then(() => setAuthorized(true))
      .catch(() => {
        sessionStorage.removeItem('scholarflow_token');
        setAuthorized(false);
      });
  }, [token]);

  if (authorized === null) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!authorized) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
