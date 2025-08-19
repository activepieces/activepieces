import { t } from 'i18next';
import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { authenticationApi } from '@/lib/authentication-api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  FROM_QUERY_PARAM,
  LOGIN_QUERY_PARAM,
  PROVIDER_NAME_QUERY_PARAM,
  STATE_QUERY_PARAM,
} from '@/lib/navigation-utils';
import { ErrorCode } from '@activepieces/shared';

const RedirectPage: React.FC = React.memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasCheckedParams = useRef(false);
  useEffect(() => {
    if (hasCheckedParams.current) {
      return;
    }
    console.log('redirection works, redirecting....');
    hasCheckedParams.current = true;
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = tryParseState(params.get(STATE_QUERY_PARAM));
    if (state && state[LOGIN_QUERY_PARAM] && code) {
      const providerName = state[PROVIDER_NAME_QUERY_PARAM];
      const from = state[FROM_QUERY_PARAM];
      const handleThirdPartyLogin = async () => {
        try {
          const data = await authenticationApi.claimThirdPartyRequest({
            providerName,
            code,
          });
          authenticationSession.saveResponse(data, false);
          navigate(from);
        } catch (e) {
          if (
            api.isError(e) &&
            (e.response?.data as { code: ErrorCode })?.code ===
              ErrorCode.INVITATION_ONLY_SIGN_UP
          ) {
            toast({
              title: t('Invitation only sign up'),
              description: t(
                'Please ask your administrator to add you to the organization.',
              ),
            });
          } else {
            toast({
              title: t('Something went wrong, please try again.'),
              description: t('Please try again.'),
              variant: 'destructive',
            });
          }
          console.error(e);

          navigate('/sign-in');
        }
      };
      handleThirdPartyLogin();
    }

    if (window.opener && code) {
      window.opener.postMessage(
        {
          code: code,
        },
        '*',
      );
    }
    if (!window.opener && !code) {
      navigate('/');
    }
  }, [location.search]);

  return <LoadingScreen />;
});

RedirectPage.displayName = 'RedirectPage';
const tryParseState = (state: string | null) => {
  if (!state) {
    return null;
  }
  try {
    return JSON.parse(state);
  } catch (e) {
    return null;
  }
};
export { RedirectPage };
