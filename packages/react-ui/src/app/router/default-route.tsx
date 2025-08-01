import { Navigate, useLocation } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { authenticationSession } from '@/lib/authentication-session';
import { determineDefaultRoute } from '@/lib/utils';

export const DefaultRoute = () => {
  const token = authenticationSession.getToken();
  const location = useLocation();
  const { embedState } = useEmbedding();

  if (!token) {
    const searchParams = new URLSearchParams();
    searchParams.set('from', location.pathname + location.search);
    return (
      <Navigate
        to={`/sign-in?${searchParams.toString()}`}
        replace={true}
      ></Navigate>
    );
  }
  return (
    <Navigate
      to={determineDefaultRoute(embedState.isEmbedded)}
      replace
    ></Navigate>
  );
};
