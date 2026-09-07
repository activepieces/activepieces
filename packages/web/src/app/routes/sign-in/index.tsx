import { AuthLanding } from '@/features/authentication';

const SignInPage: React.FC = () => {
  return <AuthLanding initialMode="signin" />;
};

SignInPage.displayName = 'SignInPage';

export { SignInPage };
