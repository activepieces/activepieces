import { t } from 'i18next';
import React, { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ApFlagId,
  isNil,
  ThirdPartyAuthnProvidersToShowMap,
} from '@activepieces/shared';

import { HorizontalSeparatorWithText } from '../../../components/ui/separator';
import { flagsHooks } from '../../../hooks/flags-hooks';

import { SignInForm } from './sign-in-form';
// import { SignUpForm } from './sign-up-form';
import { ThirdPartyLogin } from './third-party-logins';
import { authenticationSession } from '@/lib/authentication-session';

const BottomNote = ({ isSignup }: { isSignup: boolean }) => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.toString();

  return isSignup ? (
    <div className="my-4 text-center text-sm">
      {t('Already have an account?')}
      <Link
        to={`/sign-in?${searchQuery}`}
        className="pl-1 text-muted-foreground hover:text-primary text-sm transition-all duration-200"
      >
        {t('Sign in')}
      </Link>
    </div>
  ) : (
    <div className="my-4 text-center text-sm">
      {t("Don't have an account?")}
      <Link
        to={`/sign-up?${searchQuery}`}
        className="pl-1 text-muted-foreground hover:text-primary text-sm transition-all duration-200"
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
    <HorizontalSeparatorWithText className="my-4">
      {t('OR')}
    </HorizontalSeparatorWithText>
  ) : null;
};

const AuthFormTemplate = React.memo(
  ({ form }: { form: 'signin' | 'signup' }) => {
    const isSignUp = form === 'signup';
    const [searchParams] = useSearchParams();
    const from = searchParams.get('from');
    const tokenFromUrl = searchParams.get('token');
    const token = tokenFromUrl ?? authenticationSession.getToken();

    // To redirect to PromptX login page
    const { data: loginUrl } = flagsHooks.useFlag<string>(ApFlagId.LOGIN_URL);
    const { data: environment } = flagsHooks.useFlag<string>(
      ApFlagId.ENVIRONMENT,
    );

    const [showCheckYourEmailNote, setShowCheckYourEmailNote] = useState(false);
    const { data: isEmailAuthEnabled } = flagsHooks.useFlag<boolean>(
      ApFlagId.EMAIL_AUTH_ENABLED,
    );
    const data = {
      signin: {
        title: t('Welcome Back!'),
        description: t('Enter your email below to sign in to your account'),
        showNameFields: false,
      },
      signup: {
        title: t("Let's Get Started!"),
        description: t('Create your account and start flowing!'),
        showNameFields: true,
      },
    }[form];

    if (token && from) {
      return <Navigate to={from} />;
    }

    if (tokenFromUrl) {
      authenticationSession.saveToken(tokenFromUrl);
      const navigateTo = isNil(from) ? '/flows' : from;
      return <Navigate to={navigateTo} />;
    }

    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
      // For non-dev environments, we'd like to login via external screen
      if (environment !== 'dev' && !isNil(loginUrl)) {
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              // Redirect when countdown finishes
              window.location.href = loginUrl;
            }
            return prev - 1;
          });
        }, 1000);
        // Cleanup interval on component unmount
        return () => clearInterval(timer);
      }
    }, []);

    // will redirect to promptX login page
    if (environment !== 'dev' && !isNil(loginUrl)) {
      return (
        <div className="flex justify-center items-center h-500">
          <p className="text-lg font-semibold text-gray-700 mb-4">
            {t(`Logins are allowed only through CenterApp, Redirecting you in ${countdown}
            seconds...`)}
          </p>
        </div>
      );
    }

    return (
      <Card className="w-[28rem] rounded-sm drop-shadow-xl">
        {!showCheckYourEmailNote && (
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{data.title}</CardTitle>
            <CardDescription>{data.description}</CardDescription>
          </CardHeader>
        )}

        <CardContent>
          {!showCheckYourEmailNote && <ThirdPartyLogin isSignUp={isSignUp} />}
          <AuthSeparator
            isEmailAuthEnabled={
              (isEmailAuthEnabled ?? true) && !showCheckYourEmailNote
            }
          ></AuthSeparator>
          {isEmailAuthEnabled ? (
            isSignUp ? (
              // <SignUpForm
              //   setShowCheckYourEmailNote={setShowCheckYourEmailNote}
              //   showCheckYourEmailNote={showCheckYourEmailNote}
              // />
              <SignInForm />
            ) : (
              <SignInForm />
            )
          ) : null}
        </CardContent>

        <BottomNote isSignup={isSignUp}></BottomNote>
      </Card>
    );
  },
);

AuthFormTemplate.displayName = 'AuthFormTemplate';

export { AuthFormTemplate };
