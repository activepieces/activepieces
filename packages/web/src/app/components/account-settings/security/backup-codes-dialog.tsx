import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
import { Separator } from '@/components/ui/separator';
import { authClient } from '@/lib/better-auth';
import { downloadTxt } from '@/lib/utils';

function BackupCodesForm({
  backupCodesRemaining,
  onOpenChange,
  hasPassword,
}: {
  backupCodesRemaining: number;
  onOpenChange: (open: boolean) => void;
  hasPassword: boolean;
}) {
  const queryClient = useQueryClient();
  const [newCodes, setNewCodes] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setError(null);
    setIsPending(true);
    try {
      const { data, error: apiError } =
        await authClient.twoFactor.generateBackupCodes({ password });
      if (apiError || !data) {
        setError(t('Invalid password. Please try again.'));
        return;
      }
      setNewCodes(data.backupCodes);
      await queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      toast.success(t('Backup codes regenerated successfully'));
    } catch {
      setError(t('Invalid password. Please try again.'));
    } finally {
      setIsPending(false);
    }
  };

  const handleOtpComplete = async ({ value }: { value: string }) => {
    setError(null);
    setIsPending(true);
    try {
      const { error: verifyError } = await authClient.twoFactor.verifyTotp({
        code: value,
      });
      if (verifyError) {
        setError(t('Invalid code. Please try again.'));
        return;
      }
      const { data, error: genError } =
        await authClient.twoFactor.generateBackupCodes({});
      if (genError || !data) {
        setError(t('Failed to regenerate backup codes. Please try again.'));
        return;
      }
      setNewCodes(data.backupCodes);
      await queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      toast.success(t('Backup codes regenerated successfully'));
    } catch {
      setError(t('Invalid code. Please try again.'));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Backup Codes')}</DialogTitle>
        <DialogDescription>
          {backupCodesRemaining > 0
            ? t('Remaining backup codes: {{count}}', {
                count: backupCodesRemaining,
              })
            : t('Regenerate backup codes below.')}
        </DialogDescription>
      </DialogHeader>

      {newCodes.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{t('Your new backup codes')}</p>
          <div className="grid grid-cols-2 gap-2">
            {newCodes.map((code) => (
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
            onClick={() => downloadTxt(newCodes.join('\n'), 'backup-code.txt')}
          >
            <Download className="size-4 mr-2" />
            {t('Download')}
          </Button>
          <Separator />
        </div>
      )}

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">{t('Regenerate Backup Codes')}</p>
        <p className="text-xs text-muted-foreground">
          {hasPassword
            ? t(
                'Enter your password to generate new backup codes. This will invalidate all existing codes.',
              )
            : t(
                'Enter your authenticator code to generate new backup codes. This will invalidate all existing codes.',
              )}
        </p>

        {hasPassword ? (
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="backup-codes-password">{t('Password')}</Label>
              <Input
                id="backup-codes-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                {t('Close')}
              </Button>
              <Button type="submit" loading={isPending} disabled={!password}>
                {t('Regenerate')}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            <OtpInput onChange={handleOtpComplete} disabled={isPending} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                {t('Close')}
              </Button>
            </DialogFooter>
          </div>
        )}
      </div>
    </>
  );
}

function BackupCodesDialog({
  open,
  onOpenChange,
  backupCodesRemaining,
  hasPassword,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backupCodesRemaining: number;
  hasPassword: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <BackupCodesForm
          key={open ? 'open' : 'closed'}
          backupCodesRemaining={backupCodesRemaining}
          onOpenChange={onOpenChange}
          hasPassword={hasPassword}
        />
      </DialogContent>
    </Dialog>
  );
}

BackupCodesDialog.displayName = 'BackupCodesDialog';

export { BackupCodesDialog };
