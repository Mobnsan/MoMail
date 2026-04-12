import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../api';

function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let canceled = false;
    getCurrentUser()
      .then(() => {
        if (!canceled) setStatus('authenticated');
      })
      .catch(() => {
        if (!canceled) setStatus('unauthenticated');
      });
    return () => {
      canceled = true;
    };
  }, []);

  if (status === 'loading') {
    return <div className="page"><p>Checking session...</p></div>;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/signin" replace />;
  }

  return children;
}

export default ProtectedRoute;
