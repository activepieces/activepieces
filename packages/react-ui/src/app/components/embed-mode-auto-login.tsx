import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { authenticationApi } from '@/lib/authentication-api';
import { authenticationSession } from '@/lib/authentication-session';
import { useEmbedMode } from '@/hooks/use-embed-mode';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface EmbedModeAutoLoginProps {
  children: React.ReactNode;
}

export const EmbedModeAutoLogin: React.FC<EmbedModeAutoLoginProps> = ({ children }) => {
  const { isEmbedMode } = useEmbedMode();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    // Only run auto-login in embed mode
    if (!isEmbedMode) {
      return;
    }

    // Check if user is already authenticated
    const existingToken = authenticationSession.getToken();
    if (existingToken) {
      setHasAttemptedLogin(true);
      return;
    }

    // If no token parameter, show error
    if (!token) {
      setError('No authentication token provided');
      setHasAttemptedLogin(true);
      return;
    }

    // Perform auto-login
    performAutoLogin();
  }, [isEmbedMode, token]);

  const performAutoLogin = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authenticationApi.externalJwtAuth({ token });
      
      // Save the authentication response
      authenticationSession.saveResponse(response, true); // true for embedding
      
      // Navigate to /flows
      navigate('/flows', { replace: true });
      setHasAttemptedLogin(true);
    } catch (err: any) {
      console.error('Auto-login failed:', err);
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    performAutoLogin();
  };

  const handleRefreshToken = () => {
    // Send message to parent window to refresh token
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'REFRESH_TOKEN' }, '*');
    }
  };

  // If not in embed mode, render children normally
  if (!isEmbedMode) {
    return <>{children}</>;
  }

  // If still loading, show loading state
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  // If there's an error, show error state
  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              {error}
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-2 justify-center">
            <Button onClick={handleRetry} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={handleRefreshToken} variant="outline">
              Refresh Token
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If login was successful or no token needed, render children
  if (hasAttemptedLogin) {
    return <>{children}</>;
  }

  // Default loading state
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};
