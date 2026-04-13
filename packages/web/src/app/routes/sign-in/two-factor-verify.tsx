import { ErrorCode, isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';

import { FullLogo } from '@/components/custom/full-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OtpInput } from '@/components/ui/otp-input';
import { AuthLayout } from '@/features/authentication';
import { authMutations } from '@/features/authentication/hooks/auth-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';

const TwoFactorVerifyPage: React.FC = () => {
  const location = useLocation();
  const mfaToken = (location.state as { mfaToken?: string } | null)?.mfaToken;

  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectAfterLogin = useRedirectAfterLogin();

  const { mutate, isPending } = authMutations.useVerify2fa({
    onSuccess: (data) => {
      authenticationSession.saveResponse(data, false);
      redirectAfterLogin();
    },
    onError: (error) => {
      if (api.isError(error)) {
        const status = error.response?.status;
        if (status === 429) {
          setErrorMessage(t('Too many attempts. Please wait.'));
          return;
        }
        const errorCode = (error.response?.data as { code?: ErrorCode })?.code;
        if (
          errorCode === ErrorCode.INVALID_2FA_CODE ||
          errorCode === ErrorCode.INVALID_BACKUP_CODE
        ) {
          setErrorMessage(t('Invalid code. Please try again.'));
          return;
        }
      }
      setErrorMessage(t('Invalid code. Please try again.'));
    },
  });

  if (isNil(mfaToken)) {
    return <Navigate to="/sign-in" replace />;
  }

  const handleOtpComplete = ({ value }: { value: string }) => {
    setErrorMessage(null);
    mutate({ mfaToken, code: value });
  };

  const handleBackupCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupCode.trim()) return;
    setErrorMessage(null);
    mutate({ mfaToken, code: backupCode.trim() });
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <FullLogo />
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {t('Two-Factor Authentication')}
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          {useBackupCode
            ? t('Enter one of your backup codes.')
            : t('Enter the 6-digit code from your authenticator app.')}
        </p>
      </div>

      {!useBackupCode ? (
        <div className="flex flex-col gap-4">
          <OtpInput
            onChange={handleOtpComplete}
            disabled={isPending}
            autoFocus
          />
          {errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
            onClick={() => {
              setUseBackupCode(true);
              setErrorMessage(null);
            }}
          >
            {t('Use a backup code instead')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleBackupCodeSubmit} className="flex flex-col gap-4">
          <Input
            type="text"
            placeholder="xxxxxxxx"
            value={backupCode}
            onChange={(e) => setBackupCode(e.target.value)}
            disabled={isPending}
            autoFocus
          />
          {errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}
          <Button
            type="submit"
            loading={isPending}
            disabled={!backupCode.trim()}
          >
            {t('Confirm')}
          </Button>
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
            onClick={() => {
              setUseBackupCode(false);
              setErrorMessage(null);
              setBackupCode('');
            }}
          >
            {t('Use authenticator code instead')}
          </button>
        </form>
      )}

      <div className="mt-6">
        <Link
          to="/sign-in"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; {t('Back to sign in')}
        </Link>
      </div>
    </AuthLayout>
  );
};

TwoFactorVerifyPage.displayName = 'TwoFactorVerifyPage';

export { TwoFactorVerifyPage };
