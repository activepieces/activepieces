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

const SignInForm: React.FC = React.memo(() => {
  return (
    <Card className="mx-auto mt-[200px] max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>
          Enter your email below to sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ThirdPartyLogin />
        <div className="mt-4">
          <UsernameAndPasswordForm />
        </div>
      </CardContent>
    </Card>
  );
});

SignInForm.displayName = 'SignInForm';

export { SignInForm };
