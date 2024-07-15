import React from 'react';

import { ThirdPartyLogin } from './third-party-logins';
import { UsernameAndPasswordForm } from './username-and-password-form';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type AuthFormTemplateProps = {
  title: string;
  description: string;
  showNameFields: boolean;
};

const data: {
  signin: AuthFormTemplateProps;
  signup: AuthFormTemplateProps;
} = {
  signin: {
    title: 'Welcome Back!',
    description: 'Enter your email below to sign in to your account',
    showNameFields: false,
  },
  signup: {
    title: "Let's Get Started!",
    description: 'Create your account and start flowing!',
    showNameFields: true,
  },
};

const Separator = () => {
  return (
    <div className="mt-4 flex w-full flex-row items-center">
      <div className="w-1/2 border" />
      <span className="mx-2 text-sm">OR</span>
      <div className="w-1/2 border" />
    </div>
  );
};

const AuthFormTemplate: React.FC<{
  form: 'signin' | 'signup';
}> = React.memo(({ form }) => {
  const isSignUp = form === 'signup' ? true : false;

  return (
    <Card className="w-1/4 rounded-sm drop-shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">{data[form].title}</CardTitle>
        <CardDescription>{data[form].description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ThirdPartyLogin isSignUp={isSignUp} />
        <Separator />
        <UsernameAndPasswordForm isSignUp={isSignUp} />
      </CardContent>
    </Card>
  );
});

AuthFormTemplate.displayName = 'AuthFormTemplate';

export { AuthFormTemplate };
