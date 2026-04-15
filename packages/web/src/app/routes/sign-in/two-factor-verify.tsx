import { isMfaChallenge } from '@activepieces/shared';
import { t } from 'i18next';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { authenticationApi } from '@/api/authentication-api';
import { FullLogo } from '@/components/custom/full-logo';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { OtpInput } from '@/components/ui/otp-input';
import { authenticationSession } from '@/lib/authentication-session';
import { authClient } from '@/lib/better-auth';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';

const TwoFactorVerifyPage: React.FC = () => {
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const redirectAfterLogin = useRedirectAfterLogin();

  const handleVerifyTotp = async ({ value }: { value: string }) => {
    setErrorMessage(null);
    setIsPending(true);
    try {
      const { error } = await authClient.twoFactor.verifyTotp({ code: value });
      if (error) {
        setErrorMessage(t('Invalid code. Please try again.'));
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
    if (!backupCode.trim()) return;
    setErrorMessage(null);
    setIsPending(true);
    try {
      const { error } = await authClient.twoFactor.verifyBackupCode({
        code: backupCode.trim(),
      });
      if (error) {
        setErrorMessage(t('Invalid code. Please try again.'));
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

  return (
    <div className="mx-auto flex h-screen flex-col items-center justify-center gap-2">
      <FullLogo />
      <Card className="w-md rounded-sm drop-shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">
            {t('Two-Factor Authentication')}
          </CardTitle>
          <CardDescription>
            {useBackupCode
              ? t('Enter one of your backup codes.')
              : t('Enter the 6-digit code from your authenticator app.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
          <div className="mt-2">
            <Link
              to="/sign-in"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; {t('Back to sign in')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

TwoFactorVerifyPage.displayName = 'TwoFactorVerifyPage';

export { TwoFactorVerifyPage };
