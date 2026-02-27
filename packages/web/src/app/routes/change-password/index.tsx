import { FullLogo } from '@/components/ui/full-logo';
import { ChangePasswordForm } from '@/features/authentication/components/change-password';

const ChangePasswordPage = () => {
  return (
    <div className="mx-auto flex h-screen flex-col items-center justify-center gap-2">
      <FullLogo />
      <ChangePasswordForm />
    </div>
  );
};

export { ChangePasswordPage };
