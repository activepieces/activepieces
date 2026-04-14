import {
  ApFlagId,
  ThirdPartyAuthnProvidersToShowMap,
} from '@activepieces/shared';
import { t } from 'i18next';
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { FullLogo } from '@/components/custom/full-logo';
import { authenticationSession } from '@/lib/authentication-session';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';

import { HorizontalSeparatorWithText } from '../../../components/ui/separator';
import { flagsHooks } from '../../../hooks/flags-hooks';

import { IntegrationLogosOverlay } from './integration-logos-overlay';
import { SignInForm } from './sign-in-form';
import { SignUpForm } from './sign-up-form';
import { ThirdPartyLogin } from './third-party-logins';

const BottomNote = ({ isSignup }: { isSignup: boolean }) => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.toString();

  return isSignup ? (
    <div className="mt-6 text-center text-sm text-muted-foreground">
      {t('Already have an account?')}
      <Link
        to={`/sign-in?${searchQuery}`}
        className="pl-1 font-medium text-foreground hover:underline transition-all duration-200"
      >
        {t('Sign in')}
      </Link>
    </div>
  ) : (
    <div className="mt-6 text-center text-sm text-muted-foreground">
      {t("Don't have an account?")}
      <Link
        to={`/sign-up?${searchQuery}`}
        className="pl-1 font-medium text-foreground hover:underline transition-all duration-200"
      >
        {t('Sign up')}
      </Link>
    </div>
  );
};

const AuthSeparator = ({
  isEmailAuthEnabled,
}: {
  isEmailAuthEnabled: boolean;
}) => {
  const { data: thirdPartyAuthProviders } =
    flagsHooks.useFlag<ThirdPartyAuthnProvidersToShowMap>(
      ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP
    );

  return (thirdPartyAuthProviders?.google || thirdPartyAuthProviders?.saml) &&
    isEmailAuthEnabled ? (
    <HorizontalSeparatorWithText className="my-5">
      {t('OR')}
    </HorizontalSeparatorWithText>
  ) : null;
};

const AuthLayout = ({
  children,
  isSignUp,
}: {
  children: React.ReactNode;
  isSignUp?: boolean;
}) => (
  <div className="relative h-screen w-full overflow-hidden flex">
    {/* Full-cover background */}
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/auth-bg.png)' }}
    />
    <div className="absolute inset-0 bg-black/30" />

    {/* Floating form card — left-anchored */}
    <div className="relative z-10 flex items-center justify-center lg:justify-start w-full lg:w-[620px] p-4 lg:pl-24 lg:pr-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-10 w-full overflow-y-auto max-h-[95vh]">
        {children}
      </div>
    </div>

    {/* Integration logos — sign-up only, right portion of bg */}
    {isSignUp && (
      <div className="hidden lg:flex flex-1 items-center justify-center relative z-10">
        <IntegrationLogosOverlay />
      </div>
    )}
  </div>
);

AuthLayout.displayName = 'AuthLayout';

const AuthFormTemplate = React.memo(
  ({ form }: { form: 'signin' | 'signup' }) => {
    const isSignUp = form === 'signup';
    const token = authenticationSession.getToken();
    const redirectAfterLogin = useRedirectAfterLogin();
    const [showCheckYourEmailNote, setShowCheckYourEmailNote] = useState(false);
    const { data: isEmailAuthEnabled } = flagsHooks.useFlag<boolean>(
      ApFlagId.EMAIL_AUTH_ENABLED
    );
    const isCloud = window.location.hostname === 'cloud.activepieces.com';
    const data = {
      signin: {
        title: t('Welcome back'),
        description: t('Sign in to pick up where you left off.'),
      },
      signup: {
        title: t('Automate your work in minutes'),
        description: t('Join thousands of teams running on autopilot.'),
      },
    }[form];

    useEffect(() => {
      if (token) {
        redirectAfterLogin();
      }
    }, [token, redirectAfterLogin]);

    if (token) {
      return null;
    }

    return (
      <AuthLayout isSignUp={isSignUp}>
        <div className="mb-8">
          {isCloud ? (
            <Link
              to="https://activepieces.com"
              target="_blank"
              rel="noreferrer"
            >
              <FullLogo />
            </Link>
          ) : (
            <FullLogo />
          )}
        </div>

        {!showCheckYourEmailNote && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">{data.title}</h1>
            <p className="text-muted-foreground text-sm mt-1.5">
              {data.description}
            </p>
          </div>
        )}

        {!showCheckYourEmailNote && <ThirdPartyLogin isSignUp={isSignUp} />}
        <AuthSeparator
          isEmailAuthEnabled={
            (isEmailAuthEnabled ?? true) && !showCheckYourEmailNote
          }
        />

        {isEmailAuthEnabled ? (
          isSignUp ? (
            <SignUpForm
              setShowCheckYourEmailNote={setShowCheckYourEmailNote}
              showCheckYourEmailNote={showCheckYourEmailNote}
            />
          ) : (
            <SignInForm />
          )
        ) : null}

        <BottomNote isSignup={isSignUp} />
      </AuthLayout>
    );
  }
);

AuthFormTemplate.displayName = 'AuthFormTemplate';

export { AuthFormTemplate, AuthLayout };
