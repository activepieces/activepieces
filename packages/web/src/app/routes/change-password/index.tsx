import { FullLogo } from '@/components/custom/full-logo';
import { ChangePasswordForm } from '@/features/authentication';

const ChangePasswordPage = () => {
  return (
    <div className="mx-auto flex h-screen flex-col items-center justify-center gap-2">
      <FullLogo />
      <ChangePasswordForm />
    </div>
  );
};

export { ChangePasswordPage };
