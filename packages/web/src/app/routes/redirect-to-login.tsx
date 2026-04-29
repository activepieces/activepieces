import { useEffect } from 'react';

import { OTOM8_SITE_URL } from '@/lib/otom8-site-url';

// Stub for AP's legacy native auth routes. Clerk owns account lifecycle — bounce to the site login.
export const RedirectToLogin: React.FC = () => {
  useEffect(() => {
    window.location.replace(`${OTOM8_SITE_URL}/login`);
  }, []);
  return null;
};

RedirectToLogin.displayName = 'RedirectToLogin';
