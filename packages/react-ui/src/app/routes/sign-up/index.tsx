import { Navigate } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { FullLogo } from '@/components/ui/full-logo';
import { AuthFormTemplate } from '@/features/authentication/components/auth-form-template';

const SignUpPage: React.FC = () => {
  const { embedState } = useEmbedding();

  if (embedState.isEmbedded && embedState.hideSignUpPage) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <div className="mx-auto flex h-screen flex-col items-center justify-center gap-2">
      <FullLogo />
      <AuthFormTemplate form={'signup'} />
    </div>
  );
};

SignUpPage.displayName = 'SignUpPage';

export { SignUpPage };
