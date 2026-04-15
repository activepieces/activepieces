import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { toast } from 'sonner';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OtpInput } from '@/components/ui/otp-input';
import { authClient } from '@/lib/better-auth';

type Step = 'password' | 'verify' | 'backup';

function EnableTwoFaForm({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('password');
  const [password, setPassword] = useState('');
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [enableError, setEnableError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [savedChecked, setSavedChecked] = useState(false);

  const manualSecret = totpUri
    ? new URL(totpUri).searchParams.get('secret') ?? undefined
    : undefined;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setEnableError(null);
    setIsPending(true);
    try {
      const { data, error } = await authClient.twoFactor.enable({ password });
      if (error || !data) {
        setEnableError(
          error?.message ?? t('Invalid password. Please try again.'),
        );
        return;
      }
      setTotpUri(data.totpURI);
      setBackupCodes(data.backupCodes ?? []);
      setStep('verify');
    } catch {
      setEnableError(t('Invalid password. Please try again.'));
    } finally {
      setIsPending(false);
    }
  };

  const handleOtpComplete = async ({ value }: { value: string }) => {
    setVerifyError(null);
    setIsPending(true);
    try {
      const { error } = await authClient.twoFactor.verifyTotp({ code: value });
      if (error) {
        setVerifyError(t('Invalid code. Please try again.'));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      toast.success(t('Two-factor authentication has been enabled'));
      setStep('backup');
    } catch {
      setVerifyError(t('Invalid code. Please try again.'));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Two-Factor Authentication')}</DialogTitle>
        {step === 'password' && (
          <DialogDescription>
            {t('Enter your password to enable two-factor authentication.')}
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

      {step === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="enable-2fa-password">{t('Password')}</Label>
            <Input
              id="enable-2fa-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              autoFocus
            />
          </div>
          {enableError && (
            <p className="text-sm text-destructive">{enableError}</p>
          )}
          <DialogFooter>
            <Button type="submit" loading={isPending} disabled={!password}>
              {t('Continue')}
            </Button>
          </DialogFooter>
        </form>
      )}

      {step === 'verify' && (
        <div className="flex flex-col gap-4">
          {totpUri && (
            <div className="flex flex-col items-center gap-3">
              <QRCodeSVG value={totpUri} size={180} />
              {manualSecret && (
                <details className="w-full">
                  <summary className="text-xs text-muted-foreground cursor-pointer select-none text-center">
                    {t("Can't scan? Use this code")}
                  </summary>
                  <code className="block text-sm font-mono bg-muted px-2 py-1 rounded break-all mt-2 text-center">
                    {manualSecret}
                  </code>
                </details>
              )}
            </div>
          )}
          <OtpInput
            onChange={handleOtpComplete}
            disabled={isPending}
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
