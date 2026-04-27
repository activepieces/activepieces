import { AuthFormTemplate } from '@/features/authentication';

const SignInPage: React.FC = () => {
  return <AuthFormTemplate form={'signin'} />;
};

SignInPage.displayName = 'SignInPage';

export { SignInPage };
