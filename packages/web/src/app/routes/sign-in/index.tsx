import { useEffect } from 'react';

const SignInPage: React.FC = () => {
  useEffect(() => {
    window.location.replace('/login');
  }, []);

  return null;
};

SignInPage.displayName = 'SignInPage';

export { SignInPage };
