import { useEffect } from 'react';

import { OTOM8_SITE_URL } from '@/lib/otom8-site-url';

const SignInPage: React.FC = () => {
  useEffect(() => {
    window.location.replace(`${OTOM8_SITE_URL}/login`);
  }, []);

  return null;
};

SignInPage.displayName = 'SignInPage';

export { SignInPage };
