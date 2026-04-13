import { ForcedSetupCompleteResponse, isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { FullLogo } from '@/components/custom/full-logo';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { OtpInput } from '@/components/ui/otp-input';
import { AuthLayout } from '@/features/authentication';
import {
  authMutations,
  authQueries,
} from '@/features/authentication/hooks/auth-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';

type Step = 'qr' | 'verify' | 'backup';

const TwoFactorSetupPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const mfaToken = (location.state as { mfaToken?: string } | null)?.mfaToken;

  const [step, setStep] = useState<Step>('qr');
  const [completeData, setCompleteData] =
    useState<ForcedSetupCompleteResponse | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [savedChecked, setSavedChecked] = useState(false);

  const redirectAfterLogin = useRedirectAfterLogin();

  const { data: setupData } = authQueries.useForcedSetup({ mfaToken });

  const { mutate: completeSetup, isPending } =
    authMutations.useForcedSetupComplete({
      onSuccess: (data) => {
        setCompleteData(data);
        setStep('backup');
      },
      onError: () => {
        setVerifyError(t('Invalid code. Please try again.'));
      },
    });

  if (isNil(mfaToken)) {
    return <Navigate to="/sign-in" replace />;
  }

  const handleOtpComplete = ({ value }: { value: string }) => {
    setVerifyError(null);
    completeSetup({ mfaToken, code: value });
  };

  const handleFinish = () => {
    if (!isNil(completeData)) {
      authenticationSession.saveResponse(completeData, false);
      redirectAfterLogin();
    }
  };

  const handleBack = () => {
    authenticationSession.logOut();
    navigate('/sign-in');
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <FullLogo />
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {t('Set Up Two-Factor Authentication')}
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          {step === 'qr' && t('Scan the QR code with your authenticator app')}
          {step === 'verify' &&
            t('Enter the 6-digit code from your authenticator app.')}
          {step === 'backup' && t('Save your backup codes')}
        </p>
      </div>

      {step === 'qr' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-4">
            {!isNil(setupData?.qrCodeDataUrl) && (
              <img
                src={setupData.qrCodeDataUrl}
                alt="QR Code"
                className="w-48 h-48"
              />
            )}
            {!isNil(setupData?.secret) && (
              <details className="w-full">
                <summary className="text-sm text-muted-foreground cursor-pointer select-none">
                  {t("Can't scan? Use this code")}
                </summary>
                <code className="block text-sm font-mono bg-muted px-3 py-2 rounded mt-2 break-all">
                  {setupData.secret}
                </code>
              </details>
            )}
          </div>
          <Button onClick={() => setStep('verify')}>{t('Continue')}</Button>
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
            onClick={handleBack}
          >
            &larr; {t('Back to sign in')}
          </button>
        </div>
      )}

      {step === 'verify' && (
        <div className="flex flex-col gap-4">
          <OtpInput
            onChange={handleOtpComplete}
            disabled={isPending}
            autoFocus
          />
          {!isNil(verifyError) && (
            <p className="text-sm text-destructive">{verifyError}</p>
          )}
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
            onClick={() => setStep('qr')}
          >
            &larr; {t('Back')}
          </button>
        </div>
      )}

      {step === 'backup' && !isNil(completeData) && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {t(
              'Save these backup codes in a safe place. Each code can only be used once.',
            )}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {completeData.backupCodes.map((code) => (
              <code
                key={code}
                className="text-sm font-mono bg-muted px-2 py-1 rounded text-center"
              >
                {code}
              </code>
            ))}
          </div>
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
        </div>
      )}
    </AuthLayout>
  );
};

TwoFactorSetupPage.displayName = 'TwoFactorSetupPage';

export { TwoFactorSetupPage };
