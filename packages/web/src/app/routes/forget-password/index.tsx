import { FullLogo } from '@/components/ui/full-logo';
import { ResetPasswordForm } from '@/features/authentication/components/reset-password-form';

const ResetPasswordPage = () => {
  return (
    <div className="mx-auto flex h-screen flex-col items-center justify-center gap-2">
      <FullLogo />
      <ResetPasswordForm />
    </div>
  );
};

export { ResetPasswordPage };
