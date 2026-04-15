import { AuthFormTemplate } from '@/features/authentication';

const SignUpPage: React.FC = () => {
  return <AuthFormTemplate form={'signup'} />;
};

SignUpPage.displayName = 'SignUpPage';

export { SignUpPage };
