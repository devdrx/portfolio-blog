import React, { useEffect, useState } from 'react';
import { authService } from '../services/auth';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const verified = authService.verifySession();
      setIsAuthorized(verified);
      if (!verified) {
        window.location.hash = '#/admin/login';
      }
    };

    checkAuth();

    // Listen for hash changes to recheck session if they try to browse away
    window.addEventListener('hashchange', checkAuth);
    return () => window.removeEventListener('hashchange', checkAuth);
  }, []);

  if (isAuthorized === null) {
    return (
      <div 
        style={{
          display: 'flex', 
          height: '100vh', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: 'var(--nier-bg)', 
          color: 'var(--nier-text)'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.1em' }}>
            DECRYPTING CREDENTIAL SIGNATURES // SECURE_CHECK
          </p>
        </div>
      </div>
    );
  }

  return isAuthorized ? children : null;
};
export default ProtectedRoute;
