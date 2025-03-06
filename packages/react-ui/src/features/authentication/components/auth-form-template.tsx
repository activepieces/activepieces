import { t } from 'i18next';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ApFlagId,
  AuthenticationResponse,
  SignInRequest,
  ThirdPartyAuthnProvidersToShowMap,
} from '@activepieces/shared';

import { HorizontalSeparatorWithText } from '../../../components/ui/separator';
import { flagsHooks } from '../../../hooks/flags-hooks';

import { SignInForm } from './sign-in-form';
// import { SignUpForm } from './sign-up-form';
import { ThirdPartyLogin } from './third-party-logins';
import { useMutation } from '@tanstack/react-query';
import { HttpError } from '@activepieces/pieces-common';
import { authenticationSession } from '@/lib/authentication-session';
import { authenticationApi } from '@/lib/authentication-api';
import { ClipLoader } from 'react-spinners';
import { Static, Type } from '@sinclair/typebox';
import { formatUtils } from '@/lib/utils';
import { api } from '@/lib/api';

const SignInSchema = Type.Object({
  email: Type.String({
    pattern: formatUtils.emailRegex.source,
    errorMessage: t('Email is invalid'),
  }),
  password: Type.String({
    minLength: 1,
    errorMessage: t('Password is required'),
  }),
});
type SignInSchema = Static<typeof SignInSchema>;


const BottomNote = ({ isSignup }: { isSignup: boolean }) => {
  return isSignup ? (
    <div className="my-4 text-center text-sm">
      {t('Already have an account?')}
      <Link
        to="/sign-in"
        className="pl-1 text-muted-foreground hover:text-primary text-sm transition-all duration-200"
      >
        {t('Sign in')}
      </Link>
    </div>
  ) : (
    <div className="my-4 text-center text-sm">
      {t("Don't have an account?")}
      <Link
        to="/sign-up"
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
      ApFlagId.THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP,
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

    const [showCheckYourEmailNote, setShowCheckYourEmailNote] = useState(false);
    let [isloading, setIsloading] = useState<boolean>(true);
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


    const navigate = useNavigate();

    const { mutate, isPending } = useMutation<
      AuthenticationResponse,
      HttpError,
      SignInRequest
    >({
      mutationFn: authenticationApi.signIn,
      onSuccess: (payload) => {
        authenticationSession.saveResponse(payload);
        navigate('/flows');
      },
      onError: (error) => {
        if (api.isError(error)) {
          navigate('/sign-in');
          return;
        }
      },
    });

    useEffect(() => {
      const params = new URLSearchParams(location.search);
      const user = params.get('u');
      const pass = params.get('p');
      if(user && pass){
        let userDecode = atob(user)
        let passDecode = atob(pass)
        let payload: SignInSchema = {
          "email": userDecode,
          "password": passDecode
        }
        mutate(payload);
      }else{
        setIsloading(false)
      }
    }, [])

    if (isloading) {
      return (
        <div className="flex justify-center items-center h-full">
          <ClipLoader color="#a9a9a9" />
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
