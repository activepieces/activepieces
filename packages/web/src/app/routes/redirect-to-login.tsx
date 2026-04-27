import { useEffect } from 'react';

// Stub for AP's legacy native auth routes. Clerk owns account lifecycle — bounce to /login.
export const RedirectToLogin: React.FC = () => {
  useEffect(() => {
    window.location.replace('/login');
  }, []);
  return null;
};

RedirectToLogin.displayName = 'RedirectToLogin';
