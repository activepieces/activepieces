import { isMfaChallenge } from '@activepieces/shared';
import { t } from 'i18next';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { authenticationApi } from '@/api/authentication-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OtpInput } from '@/components/ui/otp-input';
import { AuthLayout, useRateLimit } from '@/features/authentication';
import { authenticationSession } from '@/lib/authentication-session';
import { authClient } from '@/lib/better-auth';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';

const TwoFactorVerifyPage: React.FC = () => {
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const redirectAfterLogin = useRedirectAfterLogin();
  const { isRateLimited, rateLimitMessage, handleRateLimitOrError } =
    useRateLimit();

  const handleVerifyTotp = async ({ value }: { value: string }) => {
    if (isRateLimited) return;
    setErrorMessage(null);
    setIsPending(true);
    try {
      const { error } = await authClient.twoFactor.verifyTotp({ code: value });
      if (error) {
        handleRateLimitOrError(error, setErrorMessage);
        return;
      }
      const data = await authenticationApi.exchangeSession();
      if (!isMfaChallenge(data)) {
        authenticationSession.saveResponse(data, false);
        redirectAfterLogin();
      }
    } catch {
      setErrorMessage(t('Invalid code. Please try again.'));
    } finally {
      setIsPending(false);
    }
  };

  const handleBackupCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupCode.trim() || isRateLimited) return;
    setErrorMessage(null);
    setIsPending(true);
    try {
      const { error } = await authClient.twoFactor.verifyBackupCode({
        code: backupCode.trim(),
      });
      if (error) {
        handleRateLimitOrError(error, setErrorMessage);
        return;
      }
      const data = await authenticationApi.exchangeSession();
      if (!isMfaChallenge(data)) {
        authenticationSession.saveResponse(data, false);
        redirectAfterLogin();
      }
    } catch {
      setErrorMessage(t('Invalid code. Please try again.'));
    } finally {
      setIsPending(false);
    }
  };

  const isDisabled = isPending || isRateLimited;

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
              disabled={isDisabled}
              autoFocus
            />
            {rateLimitMessage && (
              <p className="text-sm text-destructive">{rateLimitMessage}</p>
            )}
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
              disabled={isDisabled}
              autoFocus
            />
            {rateLimitMessage && (
              <p className="text-sm text-destructive">{rateLimitMessage}</p>
            )}
            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}
            <Button
              type="submit"
              loading={isPending}
              disabled={!backupCode.trim() || isRateLimited}
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
