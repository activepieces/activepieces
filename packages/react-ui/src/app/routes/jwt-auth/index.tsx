import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { t } from 'i18next';

const JwtAuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [noToken, setNoToken] = useState(false);

  useEffect(() => {
    const processJwtAuth = async () => {
      try {
        // Get JWT token from URL parameter
        const jwtToken = searchParams.get('token');
        
        if (!jwtToken) {
          setNoToken(true);
          setIsProcessing(false);
          return;
        }

        // Call the managed-authn endpoint (exact same as Flow project)
        const response = await api.post('/v1/managed-authn/external-token', {
          externalAccessToken: jwtToken,
        });

        // Save the authentication response
        authenticationSession.saveResponse(response.data as any, false);
        
        // Redirect to the main application
        navigate('/flows');
        
      } catch (error) {
        console.error('JWT authentication error:', error);
        
        if (api.isError(error)) {
          toast({
            title: t('Authentication Failed'),
            description: t('Invalid or expired JWT token'),
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('Authentication Error'),
            description: t('Something went wrong during authentication'),
            variant: 'destructive',
          });
        }
        
        setNoToken(true);
        setIsProcessing(false);
      }
    };

    processJwtAuth();
  }, [searchParams, navigate]);

  if (isProcessing) {
    return <LoadingScreen />;
  }

  if (noToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              JWT Authentication Required
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please provide a valid JWT token to access this application.
            </p>
            <p className="mt-4 text-xs text-gray-500">
              Expected URL format: /jwt-auth?token=YOUR_JWT_TOKEN
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default JwtAuthPage; 