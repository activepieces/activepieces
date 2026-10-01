import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { useEffect } from 'react';

import { Card } from '@/components/ui/card';
import { authenticationSession } from '@/lib/authentication-session';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';

import { AuthPage } from '../auth-layout';

import { AuthDrawerBody, AuthMode } from './auth-drawer-body';

export function AuthLanding({ initialMode }: AuthLandingProps) {
  const redirectAfterLogin = useRedirectAfterLogin();
  const signedIn =
    !isNil(authenticationSession.getToken()) &&
    !authenticationSession.isOnboarding();

  useEffect(() => {
    if (signedIn) {
      redirectAfterLogin();
    }
  }, [signedIn, redirectAfterLogin]);

  if (signedIn) {
    return null;
  }

  return (
    <AuthPage>
      <Card
        role="region"
        aria-label={t('Sign in or create your account')}
        className="w-full gap-0 py-0 animate-in fade-in duration-300"
      >
        <AuthDrawerBody initialMode={initialMode} />
      </Card>
    </AuthPage>
  );
}

type AuthLandingProps = {
  initialMode: AuthMode;
};
