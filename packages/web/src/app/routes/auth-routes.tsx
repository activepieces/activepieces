import { PageTitle } from '@/app/components/page-title';
import { VerifyEmail } from '@/features/authentication';
import { AcceptInvitation } from '@/features/members';

import { ChangePasswordPage } from './change-password';
import { ResetPasswordPage } from './forget-password';
import { SignInPage } from './sign-in';
import { TwoFactorSetupPage } from './sign-in/two-factor-setup-page';
import { TwoFactorVerifyPage } from './sign-in/two-factor-verify';
import { SignUpPage } from './sign-up';

export const authRoutes = [
  {
    path: '/forget-password',
    element: (
      <PageTitle title="Forget Password">
        <ResetPasswordPage />
      </PageTitle>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <PageTitle title="Reset Password">
        <ChangePasswordPage />
      </PageTitle>
    ),
  },
  {
    path: '/sign-in',
    element: (
      <PageTitle title="Sign In">
        <SignInPage />
      </PageTitle>
    ),
  },
  {
    path: '/sign-in/2fa',
    element: (
      <PageTitle title="Two-Factor Authentication">
        <TwoFactorVerifyPage />
      </PageTitle>
    ),
  },
  {
    path: '/sign-in/2fa-setup',
    element: (
      <PageTitle title="Set Up Two-Factor Authentication">
        <TwoFactorSetupPage />
      </PageTitle>
    ),
  },
  {
    path: '/verify-email',
    element: (
      <PageTitle title="Verify Email">
        <VerifyEmail />
      </PageTitle>
    ),
  },
  {
    path: '/sign-up',
    element: (
      <PageTitle title="Sign Up">
        <SignUpPage />
      </PageTitle>
    ),
  },
  {
    path: '/invitation',
    element: (
      <PageTitle title="Accept Invitation">
        <AcceptInvitation />
      </PageTitle>
    ),
  },
];
