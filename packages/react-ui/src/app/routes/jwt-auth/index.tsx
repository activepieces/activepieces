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

  useEffect(() => {
    const processJwtAuth = async () => {
      try {
        // Get JWT token from URL parameter
        const jwtToken = searchParams.get('token');
        
        if (!jwtToken) {
          toast({
            title: t('Authentication Error'),
            description: t('No JWT token provided'),
            variant: 'destructive',
          });
          navigate('/sign-in');
          return;
        }

        // Call the managed-authn endpoint (exact same as Flow project)
        const response = await api.post('/v1/managed-authn/external-token', {
          externalAccessToken: jwtToken,
        });

        // Save the authentication response
        authenticationSession.saveResponse(response.data, false);
        
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
        
        navigate('/sign-in');
      } finally {
        setIsProcessing(false);
      }
    };

    processJwtAuth();
  }, [searchParams, navigate]);

  if (isProcessing) {
    return <LoadingScreen />;
  }

  return null;
};

export default JwtAuthPage; 