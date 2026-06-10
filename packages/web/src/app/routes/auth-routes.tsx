import { PageTitle } from '@/app/components/page-title';
import { VerifyEmail } from '@/features/authentication';
import { AcceptInvitation } from '@/features/members';

import { ChangePasswordPage } from './change-password';
import { CreatePlatformPage } from './create-platform';
import { ResetPasswordPage } from './forget-password';
import { SignInPage } from './sign-in';
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
    path: '/create-platform',
    element: (
      <PageTitle title="Create Platform">
        <CreatePlatformPage />
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
