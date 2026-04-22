import { t } from 'i18next';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OtpInput } from '@/components/ui/otp-input';
import {
  AuthLayout,
  twoFactorMutations,
  twoFactorUtils,
} from '@/features/authentication';
import { authenticationSession } from '@/lib/authentication-session';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';

const TwoFactorVerifyPage: React.FC = () => {
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectAfterLogin = useRedirectAfterLogin();

  const verifyTotpMutation = twoFactorMutations.useVerifyTotp({
    onSuccess: (data) => {
      authenticationSession.saveResponse(data, false);
      redirectAfterLogin();
    },
    onError: (error) => {
      setErrorMessage(twoFactorUtils.extractErrorMessage(error));
    },
  });

  const verifyBackupCodeMutation = twoFactorMutations.useVerifyBackupCode({
    onSuccess: (data) => {
      authenticationSession.saveResponse(data, false);
      redirectAfterLogin();
    },
    onError: (error) => {
      setErrorMessage(twoFactorUtils.extractErrorMessage(error));
    },
  });

  const handleVerifyTotp = ({ value }: { value: string }) => {
    setErrorMessage(null);
    verifyTotpMutation.mutate({ code: value });
  };

  const handleBackupCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupCode.trim()) return;
    setErrorMessage(null);
    verifyBackupCodeMutation.mutate({ code: backupCode.trim() });
  };

  const isPending =
    verifyTotpMutation.isPending || verifyBackupCodeMutation.isPending;

  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "'Sentient', serif" }}
        >
          {t('Two-Factor Authentication')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {useBackupCode
            ? t('Enter one of your backup codes.')
            : t('Enter the 6-digit code from your authenticator app.')}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {!useBackupCode ? (
          <>
            <OtpInput
              onChange={handleVerifyTotp}
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
          </>
        ) : (
          <form
            onSubmit={handleBackupCodeSubmit}
            className="flex flex-col gap-4"
          >
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
