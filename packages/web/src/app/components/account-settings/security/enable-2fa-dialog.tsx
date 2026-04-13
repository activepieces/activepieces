import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { toast } from 'sonner';

import { authenticationApi } from '@/api/authentication-api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OtpInput } from '@/components/ui/otp-input';
import { HttpError } from '@/lib/api';

type Step = 'qr' | 'verify' | 'backup';

function EnableTwoFaForm({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('qr');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [savedChecked, setSavedChecked] = useState(false);

  const { data: setupData } = useQuery({
    queryKey: ['2fa-setup'],
    queryFn: () => authenticationApi.setup2fa(),
    // Prevent refetch on focus: switching to the authenticator app to scan the QR
    // would trigger a refetch, regenerate the secret in the DB, and cause the
    // code from the already-scanned QR to fail verification.
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const { mutate: enable2fa, isPending: isEnabling } = useMutation<
    { backupCodes: string[] },
    HttpError,
    { code: string }
  >({
    mutationFn: authenticationApi.enable2fa,
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      toast.success(t('Two-factor authentication has been enabled'));
      setStep('backup');
    },
    onError: () => {
      setVerifyError(t('Invalid code. Please try again.'));
    },
  });

  const handleOtpComplete = ({ value }: { value: string }) => {
    setVerifyError(null);
    enable2fa({ code: value });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Two-Factor Authentication')}</DialogTitle>
        {step === 'qr' && (
          <DialogDescription>
            {t('Scan the QR code with your authenticator app')}
          </DialogDescription>
        )}
        {step === 'verify' && (
          <DialogDescription>
            {t('Verify your authenticator code')}
          </DialogDescription>
        )}
        {step === 'backup' && (
          <DialogDescription>{t('Your backup codes')}</DialogDescription>
        )}
      </DialogHeader>

      {step === 'qr' && (
        <div className="flex flex-col items-center gap-4">
          {setupData?.qrCodeDataUrl && (
            <img
              src={setupData.qrCodeDataUrl}
              alt="QR Code"
              className="w-48 h-48"
            />
          )}
          {setupData?.secret && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {t('Or enter the code manually')}
              </p>
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {setupData.secret}
              </code>
            </div>
          )}
          <DialogFooter className="w-full">
            <Button onClick={() => setStep('verify')}>{t('Next')}</Button>
          </DialogFooter>
        </div>
      )}

      {step === 'verify' && (
        <div className="flex flex-col gap-4">
          <OtpInput
            onChange={handleOtpComplete}
            disabled={isEnabling}
            autoFocus
          />
          {verifyError && (
            <p className="text-sm text-destructive">{verifyError}</p>
          )}
        </div>
      )}

      {step === 'backup' && (
        <div className="flex flex-col gap-4">
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
          <div className="flex items-center gap-2">
            <Checkbox
              id="saved-codes"
              checked={savedChecked}
              onCheckedChange={(checked) => setSavedChecked(checked === true)}
            />
            <label
              htmlFor="saved-codes"
              className="text-sm cursor-pointer select-none"
            >
              {t("I've saved these codes")}
            </label>
          </div>
          <DialogFooter>
            <Button
              disabled={!savedChecked}
              onClick={() => onOpenChange(false)}
            >
              {t('Close')}
            </Button>
          </DialogFooter>
        </div>
      )}
    </>
  );
}

function EnableTwoFaDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <EnableTwoFaForm
          key={open ? 'open' : 'closed'}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}

EnableTwoFaDialog.displayName = 'EnableTwoFaDialog';

export { EnableTwoFaDialog };
