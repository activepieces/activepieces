import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';

const AuthenticatePage = () => {
  const redirectAfterLogin = useRedirectAfterLogin();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const response = searchParams.get('response');

  useEffect(() => {
    if (response) {
      const decodedResponse = JSON.parse(response);
      authenticationSession.saveResponse(decodedResponse, false);
      redirectAfterLogin();
    }
  }, [response]);

  return <>Please wait...</>;
};

export default AuthenticatePage;
