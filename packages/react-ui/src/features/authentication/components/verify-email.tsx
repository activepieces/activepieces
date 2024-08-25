import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/spinner';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';
import { authenticationApi } from '@/lib/authentication-api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { MailCheck, MailX } from 'lucide-react';
import { useLayoutEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

const VerifyEmail = () => {
  const [isExpired, setIsExpired] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const otp = searchParams.get('otpcode');
  const userId = searchParams.get('userId');
  const queryClient = useQueryClient();
  const branding = flagsHooks.useWebsiteBranding(queryClient);
  if (!otp || !userId) {
    return <Navigate to="/sign-in" replace />;
  }
  useLayoutEffect(() => {
    mutate();
  }, []);
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      return await authenticationApi.verifyEmail({
        otp,
        userId,
      });
    },
    onSuccess: () => {
      setTimeout(() => navigate('/sign-in'), 3000);
    },
    onError: (error) => {
      if (
        api.isError(error) &&
        error.response?.status === HttpStatusCode.Gone
      ) {
        setIsExpired(true);
        setTimeout(() => navigate('/sign-in'), 3000);
      } else {
        console.error(error);
        toast(INTERNAL_ERROR_TOAST);
        setTimeout(() => navigate('/sign-in'), 3000);
      }
    },
  });

  return (
    <div className="h-screen w-screen flex flex-col  items-center justify-center gap-2">
      <div className="h-[60px]">
        <img
          className="h-full"
          src={branding.logos.fullLogoUrl}
          alt={t('logo')}
        />
      </div>

      <Card className="w-[28rem] rounded-sm drop-shadow-xl p-4">
        <div className="gap-2 w-full flex flex-col">
          <div className="gap-4 w-full flex flex-row items-center justify-center">
            {!isPending && !isExpired && (
              <>
                <MailCheck className="w-16 h-16" />
                <span className="text-left w-fit">
                  {t(
                    'email has been verified. You will be redirected to sign in...',
                  )}
                </span>
              </>
            )}
            {isPending && !isExpired && (
              <>
                <LoadingSpinner className="w-16 h-16" />
                <span className="text-left w-fit">
                  {t('Verifying email...')}
                </span>
              </>
            )}

            {isExpired && (
              <>
                <MailX className="w-16 h-16" />
                <span className="text-left w-fit">
                  {t('invitation has expired, redirecting to sign in...')}
                </span>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
VerifyEmail.displayName = 'VerifyEmail';
export { VerifyEmail };
