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
          // No token in URL - try to get from localStorage or sessionStorage
          // This allows the dashboard to set the token and Activepieces to use it
          const storedToken = localStorage.getItem('dashboard_jwt_token') || 
                            sessionStorage.getItem('dashboard_jwt_token') ||
                            window.parent?.localStorage?.getItem('dashboard_jwt_token');
          
          if (storedToken) {
            // Use the stored token from dashboard
            const response = await api.post('/v1/managed-authn/external-token', {
              externalAccessToken: storedToken,
            });
            
            authenticationSession.saveResponse((response as any).data, false);
            navigate('/flows');
            return;
          }
          
          // No token found - show SSO message
          setIsProcessing(false);
          return;
        }

        // Call the managed-authn endpoint (exact same as Flow project)
        const response = await api.post('/v1/managed-authn/external-token', {
          externalAccessToken: jwtToken,
        });

        // Save the authentication response
        authenticationSession.saveResponse((response as any).data, false);
        
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
        
        // Stay on this page instead of redirecting to login
        setIsProcessing(false);
      }
    };

    processJwtAuth();
  }, [searchParams, navigate]);

  if (isProcessing) {
    return <LoadingScreen />;
  }

  // Show SSO portal message - NO LOGIN FORM
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            SSO Authentication Required
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            This application requires SSO authentication.
          </p>
          <p className="mt-4 text-xs text-gray-500">
            Please access this application through your SSO portal.
          </p>
          <p className="mt-4 text-xs text-gray-500">
            Expected URL: /jwt-auth?token=YOUR_JWT_TOKEN
          </p>
        </div>
      </div>
    </div>
  );
};

export default JwtAuthPage; 