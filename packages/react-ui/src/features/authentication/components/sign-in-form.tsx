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

const Separator = () => {
  return (
    <div className="mt-4 flex w-full flex-row items-center">
      <div className="w-1/2 border" />
      <span className="mx-2 text-sm">OR</span>
      <div className="w-1/2 border" />
    </div>
  );
};

const SignInForm: React.FC = React.memo(() => {
  return (
    <Card className="w-1/4 rounded-sm drop-shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome Back!</CardTitle>
        <CardDescription>
          Enter your email below to sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ThirdPartyLogin />
        <Separator />
        <UsernameAndPasswordForm />
      </CardContent>
    </Card>
  );
});

SignInForm.displayName = 'SignInForm';

export { SignInForm };
