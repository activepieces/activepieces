import { FullLogo } from '@/components/ui/full-logo';
import { AuthBootstrap } from '@/features/authentication/components/auth-bootstrap';
import { AuthFormTemplate } from '@/features/authentication/components/auth-form-template';

const SignInPage: React.FC = () => {
  return (
    <div className="mx-auto flex h-screen flex-col items-center justify-center gap-2">
      <FullLogo />
      <AuthBootstrap>
        <AuthFormTemplate form={'signin'} />
      </AuthBootstrap>
    </div>
  );
};

SignInPage.displayName = 'SignInPage';

export { SignInPage };
