import { FullLogo } from '@/components/custom/full-logo';
import { ResetPasswordForm } from '@/features/authentication';

const ResetPasswordPage = () => {
  return (
    <div className="mx-auto flex h-screen flex-col items-center justify-center gap-2">
      <FullLogo />
      <ResetPasswordForm />
    </div>
  );
};

export { ResetPasswordPage };
