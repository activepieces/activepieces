import { TelemetryEventName } from '@activepieces/shared';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { MailCheck, MailX } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { LoadingSpinner } from '@/components/custom/spinner';
import { useTelemetry } from '@/components/providers/telemetry-provider';
import { internalErrorToast } from '@/components/ui/sonner';
import { usePartnerStack } from '@/hooks/use-partner-stack';
import { api } from '@/lib/api';
import { pendingRedirect } from '@/lib/navigation-utils';

import { authMutations } from '../hooks/auth-hooks';

import { AuthCard, AuthPage } from './auth-layout';

const VerifyEmail = () => {
  const [isExpired, setIsExpired] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const otp = searchParams.get('otpcode');
  const identityId = searchParams.get('identityId');
  const hasMutated = useRef(false);
  const { reportSignup } = usePartnerStack();
  const { capture } = useTelemetry();

  const { mutate, isPending } = authMutations.useVerifyEmail({
    onSuccess: ({ email, firstName }) => {
      capture({
        name: TelemetryEventName.EMAIL_VERIFICATION_COMPLETED,
        payload: {},
      });
      reportSignup(email, firstName);
      setTimeout(() => navigate(pendingRedirect.takeSignInPath()), 5000);
    },
    onError: (error) => {
      if (
        api.isError(error) &&
        error.response?.status === HttpStatusCode.Gone
      ) {
        setIsExpired(true);
        setTimeout(() => navigate(pendingRedirect.takeSignInPath()), 5000);
      } else {
        console.error(error);
        internalErrorToast();
        setTimeout(() => navigate(pendingRedirect.takeSignInPath()), 5000);
      }
    },
  });

  useEffect(() => {
    if (otp && identityId && !hasMutated.current) {
      mutate({ otp, identityId });
      hasMutated.current = true;
    }
  }, [otp, identityId, mutate]);

  if (!otp || !identityId) {
    return <Navigate to="/sign-in" replace />;
  }
  return (
    <AuthPage>
      <AuthCard>
        {isPending && !isExpired && (
          <StatusRow icon={<LoadingSpinner className="size-4" />}>
            {t('Verifying email...')}
          </StatusRow>
        )}
        {!isPending && !isExpired && (
          <StatusRow icon={<MailCheck className="size-4" />}>
            {t('Email has been verified. You will be redirected to sign in...')}
          </StatusRow>
        )}
        {isExpired && (
          <StatusRow icon={<MailX className="size-4" />}>
            <span>
              {t(
                'invitation has expired, once you sign in again you will be able to resend the verification email.',
              )}
            </span>
            <span className="text-gray-11">
              {t('Redirecting to sign in...')}
            </span>
          </StatusRow>
        )}
      </AuthCard>
    </AuthPage>
  );
};

function StatusRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gray-3 text-gray-12">
        {icon}
      </div>
      <div className="flex min-h-9 flex-col justify-center gap-1 text-sm text-gray-12">
        {children}
      </div>
    </div>
  );
}

VerifyEmail.displayName = 'VerifyEmail';

export { VerifyEmail };
