import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';
import { federatedLoginRedirect } from '@/lib/federated-login-redirect';

const AuthenticatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const response = searchParams.get('response');

  useEffect(() => {
    if (response) {
      const decodedResponse = JSON.parse(response);
      authenticationSession.saveResponse(decodedResponse, false);
      navigate(federatedLoginRedirect.consume() ?? '/flows');
    }
  }, [response]);

  return <>Please wait...</>;
};

export default AuthenticatePage;
