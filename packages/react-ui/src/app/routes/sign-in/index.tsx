import { SignInForm } from '@/features/authentication/components/sign-in-form';

const SignInPage: React.FC = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2">
      <img
        src="https://cdn.activepieces.com/brand/full-logo.png"
        width={205}
        height={205}
      />
      <SignInForm />
    </div>
  );
};
SignInPage.displayName = 'SignInPage';

export { SignInPage };
