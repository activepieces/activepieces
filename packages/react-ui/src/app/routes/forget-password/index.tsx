import { ResetPasswordForm } from '@/features/authentication/components/reset-password-form';
import { FullLogo } from '@/components/ui/full-logo';

const ResetPasswordPage = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2">
      <FullLogo />
      <ResetPasswordForm />
    </div>
  );
};

export { ResetPasswordPage };
