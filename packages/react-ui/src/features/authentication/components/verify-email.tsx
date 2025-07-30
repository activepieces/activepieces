import { useMutation } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { MailCheck, MailX } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { Card } from '@/components/ui/card';
import { FullLogo } from '@/components/ui/full-logo';
import { LoadingSpinner } from '@/components/ui/spinner';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { usePartnerStack } from '@/hooks/use-partner-stack';
import { api } from '@/lib/api';
import { authenticationApi } from '@/lib/authentication-api';

const VerifyEmail = () => {
  const [isExpired, setIsExpired] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const otp = searchParams.get('otpcode');
  const identityId = searchParams.get('identityId');
  const hasMutated = useRef(false);
  const { reportSignup } = usePartnerStack();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      return await authenticationApi.verifyEmail({
        otp: otp!,
        identityId: identityId!,
      });
    },
    onSuccess: ({ email, firstName }) => {
      reportSignup(email, firstName);
      setTimeout(() => navigate('/sign-in'), 5000);
    },
    onError: (error) => {
      if (
        api.isError(error) &&
        error.response?.status === HttpStatusCode.Gone
      ) {
        setIsExpired(true);
        setTimeout(() => navigate('/sign-in'), 5000);
      } else {
        console.error(error);
        toast(INTERNAL_ERROR_TOAST);
        setTimeout(() => navigate('/sign-in'), 5000);
      }
    },
  });

  useEffect(() => {
    if (otp && identityId && !hasMutated.current) {
      mutate();
      hasMutated.current = true;
    }
  }, [otp, identityId, mutate]);

  if (!otp || !identityId) {
    return <Navigate to="/sign-in" replace />;
  }
  return (
    <div className="mx-auto h-screen w-screen flex flex-col items-center justify-center gap-2">
      <FullLogo />

      <Card className="w-[28rem] rounded-sm drop-shadow-xl p-4">
        <div className="gap-2 w-full flex flex-col">
          <div className="gap-4 w-full flex flex-row items-center justify-center">
            {!isPending && !isExpired && (
              <>
                <MailCheck className="w-16 h-16" />
                <span className="text-left w-fit">
                  {t(
                    'Email has been verified. You will be redirected to sign in...',
                  )}
                </span>
              </>
            )}
            {isPending && !isExpired && (
              <>
                <LoadingSpinner className="size-6" />
                <span className="text-left w-fit">
                  {t('Verifying email...')}
                </span>
              </>
            )}

            {isExpired && (
              <>
                <MailX className="w-16 h-16" />
                <div className="text-left w-fit">
                  <div>
                    {t(
                      'invitation has expired, once you sign in again you will be able to resend the verification email.',
                    )}
                  </div>
                  <div>{t('Redirecting to sign in...')}</div>
                </div>
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
