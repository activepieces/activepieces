import { AuthFormTemplate } from '@/features/authentication';

const SignUpPage: React.FC = () => {
  return (
    <div className="mx-auto flex h-screen flex-col items-center justify-center gap-2">
      <AuthFormTemplate form={'signup'} />
    </div>
  );
};

SignUpPage.displayName = 'SignUpPage';

export { SignUpPage };
