import { isMfaChallenge, AuthenticationResponse } from '@activepieces/shared';
import { t } from 'i18next';
import { Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { authenticationApi } from '@/api/authentication-api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { OtpInput } from '@/components/ui/otp-input';
import { AuthLayout, useRateLimit } from '@/features/authentication';
import { authenticationSession } from '@/lib/authentication-session';
import { authClient } from '@/lib/better-auth';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';
import { downloadTxt } from '@/lib/utils';

type Step = 'verify' | 'backup';

const TwoFactorSetupPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    password?: string;
    enforced?: boolean;
  } | null;
  const password = state?.password;
  const enforced = state?.enforced ?? true;

  const [step, setStep] = useState<Step>('verify');
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [authData, setAuthData] = useState<AuthenticationResponse | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [savedChecked, setSavedChecked] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [enableError, setEnableError] = useState<string | null>(null);

  const redirectAfterLogin = useRedirectAfterLogin();
  const { isRateLimited, rateLimitMessage, handleRateLimitOrError } =
    useRateLimit();

  useEffect(() => {
    const enableTotp = async () => {
      setIsPending(true);
      try {
        const { data, error } = await authClient.twoFactor.enable({
          ...(password ? { password } : {}),
        });
        if (error || !data) {
          setEnableError(t('Failed to initialize 2FA. Please try again.'));
          return;
        }
        setTotpUri(data.totpURI);
        setBackupCodes(data.backupCodes ?? []);
      } catch {
        setEnableError(t('Failed to initialize 2FA. Please try again.'));
      } finally {
        setIsPending(false);
      }
    };
    enableTotp();
  }, []);

  const handleSkip = async () => {
    setIsPending(true);
    try {
      const data = await authenticationApi.exchangeSession();
      if (!isMfaChallenge(data)) {
        authenticationSession.saveResponse(data, false);
        redirectAfterLogin();
      }
    } catch {
      navigate('/sign-in');
    } finally {
      setIsPending(false);
    }
  };

  const handleVerifyOtp = async ({ value }: { value: string }) => {
    if (isRateLimited) return;
    setVerifyError(null);
    setIsPending(true);
    try {
      const { error } = await authClient.twoFactor.verifyTotp({ code: value });
      if (error) {
        handleRateLimitOrError(error, setVerifyError);
        return;
      }
      const data = await authenticationApi.exchangeSession();
      if (!isMfaChallenge(data)) {
        setAuthData(data);
        setStep('backup');
      }
    } catch {
      setVerifyError(t('Invalid code. Please try again.'));
    } finally {
      setIsPending(false);
    }
  };

  const handleFinish = () => {
    if (authData) {
      authenticationSession.saveResponse(authData, false);
      redirectAfterLogin();
    }
  };

  const manualSecret = totpUri
    ? new URL(totpUri).searchParams.get('secret') ?? undefined
    : undefined;

  const stepTitle: Record<Step, string> = {
    verify: t('Set Up Two-Factor Authentication'),
    backup: t('Set Up Two-Factor Authentication'),
  };

  const stepDescription: Record<Step, string> = {
    verify: t(
      'Scan the QR code with your authenticator app, then enter the 6-digit code.',
    ),
    backup: t('Save your backup codes'),
  };

  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "'Sentient', serif" }}
        >
          {stepTitle[step]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {stepDescription[step]}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {step === 'verify' && (
          <>
            {enableError && (
              <p className="text-sm text-destructive">{enableError}</p>
            )}
            {totpUri && (
              <div className="flex flex-col items-center gap-3">
                <QRCodeSVG value={totpUri} size={180} />
                {manualSecret && (
                  <details className="w-full">
                    <summary className="text-sm text-muted-foreground cursor-pointer select-none text-center">
                      {t("Can't scan? Use this code")}
                    </summary>
                    <code className="block text-sm font-mono bg-muted px-3 py-2 rounded mt-2 break-all text-center">
                      {manualSecret}
                    </code>
                  </details>
                )}
              </div>
            )}
            <div className="flex justify-center">
              <OtpInput
                onChange={handleVerifyOtp}
                disabled={isPending || !totpUri || isRateLimited}
                autoFocus
              />
            </div>
            {rateLimitMessage && (
              <p className="text-sm text-destructive">{rateLimitMessage}</p>
            )}
            {verifyError && (
              <p className="text-sm text-destructive">{verifyError}</p>
            )}
            {!enforced && (
              <Button
                variant="outline"
                loading={isPending}
                onClick={handleSkip}
              >
                {t('Skip for now')}
              </Button>
            )}
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
              onClick={() => navigate('/sign-in')}
            >
              &larr; {t('Back to sign in')}
            </button>
          </>
        )}

        {step === 'backup' && (
          <>
            <p className="text-sm text-muted-foreground">
              {t(
                'Save these backup codes in a safe place. Each code can only be used once.',
              )}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code) => (
                <code
                  key={code}
                  className="text-sm font-mono bg-muted px-2 py-1 rounded text-center"
                >
                  {code}
                </code>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadTxt(backupCodes.join('\n'), 'backup-code.txt')
              }
            >
              <Download className="size-4 mr-2" />
              {t('Download')}
            </Button>
            <div className="flex items-center gap-2">
              <Checkbox
                id="saved-backup-codes"
                checked={savedChecked}
                onCheckedChange={(checked) => setSavedChecked(checked === true)}
              />
              <label
                htmlFor="saved-backup-codes"
                className="text-sm cursor-pointer select-none"
              >
                {t('I have saved these backup codes in a safe place')}
              </label>
            </div>
            <Button disabled={!savedChecked} onClick={handleFinish}>
              {t('Continue to app')}
            </Button>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

TwoFactorSetupPage.displayName = 'TwoFactorSetupPage';

export { TwoFactorSetupPage };
