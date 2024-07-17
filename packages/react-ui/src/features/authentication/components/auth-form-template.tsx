import React from 'react';

import { SignInForm } from './sign-in-form';
import { SignUpForm } from './sign-up-form';
import { ThirdPartyLogin } from './third-party-logins';

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
    <div className="my-4 flex w-full flex-row items-center">
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
    <Card className="w-[28rem] rounded-sm drop-shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{data[form].title}</CardTitle>
        <CardDescription>{data[form].description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ThirdPartyLogin isSignUp={isSignUp} />
        <Separator />
        {isSignUp ? <SignUpForm /> : <SignInForm />}
      </CardContent>
    </Card>
  );
});

AuthFormTemplate.displayName = 'AuthFormTemplate';

export { AuthFormTemplate };
