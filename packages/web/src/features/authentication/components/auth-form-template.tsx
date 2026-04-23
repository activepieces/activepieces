import {
  ApEdition,
  ApFlagId,
  ThirdPartyAuthnProvidersToShowMap,
} from '@activepieces/shared';
import { t } from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';

import { FullLogo } from '../../../components/custom/full-logo';
import { HorizontalSeparatorWithText } from '../../../components/ui/separator';
import { flagsHooks } from '../../../hooks/flags-hooks';

import { AuthAnimation } from './auth-animation';
import { SignInForm } from './sign-in-form';
import { SignUpForm } from './sign-up-form';
import { ThirdPartyLogin } from './third-party-logins';

const BottomNote = ({ isSignup }: { isSignup: boolean }) => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.toString();

  return isSignup ? (
    <div className="mt-6 text-center text-[14px] text-muted-foreground">
      {t('Already have an account?')}
      <Link
        to={`/sign-in?${searchQuery}`}
        className="pl-1 font-medium text-foreground hover:underline transition-all duration-200"
      >
        {t('Sign in')}
      </Link>
    </div>
  ) : (
    <div className="mt-6 text-center text-[14px] text-muted-foreground">
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

const TermsFooter = () => {
  const { data: termsOfServiceUrl } = flagsHooks.useFlag<string>(
    ApFlagId.TERMS_OF_SERVICE_URL,
  );
  const { data: privacyPolicyUrl } = flagsHooks.useFlag<string>(
    ApFlagId.PRIVACY_POLICY_URL,
  );
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  if (
    edition !== ApEdition.CLOUD ||
    (!termsOfServiceUrl && !privacyPolicyUrl)
  ) {
    return null;
  }

  return (
    <div className="text-center text-xs text-muted-foreground">
      {t('By continuing, you agree to our')}
      {termsOfServiceUrl && (
        <Link
          to={termsOfServiceUrl}
          target="_blank"
          className="px-1 text-muted-foreground underline hover:text-primary text-xs transition-all duration-200"
        >
          {t('Terms of Service')}
        </Link>
      )}
      {termsOfServiceUrl && privacyPolicyUrl && t('and')}
      {privacyPolicyUrl && (
        <Link
          to={privacyPolicyUrl}
          target="_blank"
          className="pl-1 text-muted-foreground underline hover:text-primary text-xs transition-all duration-200"
        >
          {t('Privacy Policy')}
        </Link>
      )}
      .
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
      ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP,
    );

  return (thirdPartyAuthProviders?.google || thirdPartyAuthProviders?.saml) &&
    isEmailAuthEnabled ? (
    <HorizontalSeparatorWithText className="my-5 text-muted-foreground">
      {t('or')}
    </HorizontalSeparatorWithText>
  ) : null;
};

const AuthImage = () => {
  const [loaded, setLoaded] = useState(false);
  const onLoad = useCallback(() => setLoaded(true), []);

  return (
    <img
      src="https://cdn.activepieces.com/assets/auth-bg.webp"
      alt=""
      onLoad={onLoad}
      className={cn(
        'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
        loaded ? 'opacity-100' : 'opacity-0',
      )}
    />
  );
};

const AuthLayout = ({
  children,
  isSignUp,
}: {
  children: React.ReactNode;
  isSignUp?: boolean;
}) => (
  <div className="h-screen w-full overflow-hidden flex bg-white relative">
    {/* Form — left side */}
    <div className="flex flex-col w-full lg:w-1/2 p-5 lg:px-[100px]">
      <div className="pt-3 flex justify-center">
        <FullLogo />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-xs overflow-y-auto px-1">{children}</div>
      </div>
      {isSignUp && (
        <div className="pb-4">
          <TermsFooter />
        </div>
      )}
    </div>

    {/* Right side — animation for sign-up, image for sign-in */}
    <div className="hidden lg:flex w-1/2 py-5 pr-5">
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-muted">
        {isSignUp ? <AuthAnimation /> : <AuthImage />}
      </div>
    </div>
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
      ApFlagId.EMAIL_AUTH_ENABLED,
    );
    const data = {
      signin: {
        title: t('Welcome back'),
        description: t('Sign in to pick up where you left off.'),
      },
      signup: {
        title: t('Create a new account'),
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
        {!showCheckYourEmailNote && (
          <div className="mb-6 text-center">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "'Sentient', serif" }}
            >
              {data.title}
            </h1>
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
  },
);

AuthFormTemplate.displayName = 'AuthFormTemplate';

export { AuthFormTemplate, AuthLayout };
