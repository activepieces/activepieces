import { useEffect, useState } from 'react';

import { authenticationApi } from '@/lib/authentication-api';
import { authenticationSession } from '@/lib/authentication-session';

// AuthInitializer.tsx
export const AuthInitializer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isReady, setIsReady] = useState(authenticationSession.isLoggedIn());

  useEffect(() => {
    const init = async () => {
      if (authenticationSession.isLoggedIn()) {
        setIsReady(true);
        return;
      }

      try {
        const result = await authenticationApi.signIn({
          email: 'dev@ap.com',
          password: '12345678',
        });
        authenticationSession.saveResponse(result, false);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      }
    };

    init();
  }, []);

  if (!isReady) {
    return <div>Initializing...</div>;
  }

  return <>{children}</>;
};
