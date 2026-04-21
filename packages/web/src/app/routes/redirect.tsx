import { ErrorCode } from '@activepieces/shared';
import { t } from 'i18next';
import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { LoadingScreen } from '@/components/custom/loading-screen';
import { internalErrorToast } from '@/components/ui/sonner';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  ERROR_QUERY_PARAM,
  RESPONSE_QUERY_PARAM,
  STATE_QUERY_PARAM,
} from '@/lib/navigation-utils';
import { getCookie } from '@/lib/utils';

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

    const response = tryParseState(params.get(RESPONSE_QUERY_PARAM));
    const state = tryParseState(params.get(STATE_QUERY_PARAM));
    const error = tryParseState(params.get(ERROR_QUERY_PARAM));

    if (error) {
      if (error.code === ErrorCode.INVITATION_ONLY_SIGN_UP) {
        toast(t('Invitation only sign up'), {
          description: t(
            'Please ask your administrator to add you to the organization.',
          ),
        });
      } else {
        internalErrorToast();
      }
      navigate('/sign-in');
      return;
    }

    const mfa = params.get('mfa');
    if (mfa === 'verify') {
      navigate('/sign-in/2fa');
      return;
    }
    if (mfa === 'setup') {
      const enforced = params.get('enforced') !== 'false';
      navigate('/sign-in/2fa-setup', { state: { enforced } });
      return;
    }

    if (state && response) {
      const from = state.from ?? '/flows';

      const handleThirdPartyLogin = async () => {
        try {
          const token = getCookie('token');
          authenticationSession.saveResponse({ ...response, token }, false);
          navigate(from);
        } catch (e) {
          if (
            api.isError(e) &&
            (e.response?.data as { code: ErrorCode })?.code ===
              ErrorCode.INVITATION_ONLY_SIGN_UP
          ) {
            toast(t('Invitation only sign up'), {
              description: t(
                'Please ask your administrator to add you to the organization.',
              ),
            });
          } else {
            internalErrorToast();
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
