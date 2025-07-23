import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';

/*
This higher order component wraps AuthFormTemplate to allow token persistence when token is passed
as a query parameter in the sign in endpoint.
*/
export const AuthBootstrap = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const redirectAfterLogin = useRedirectAfterLogin();

  const searchParams = new URLSearchParams(location.search);
  const tokenFromUrl = searchParams.get('token');

  useEffect(() => {
    if (tokenFromUrl) {
      authenticationSession.saveToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  useEffect(() => {
    // Only redirect if token is present
    if (authenticationSession.getToken()) {
      redirectAfterLogin();
    }
  }, [redirectAfterLogin]);

  return children;
};
