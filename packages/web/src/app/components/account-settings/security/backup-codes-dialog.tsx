import { useQueryClient, useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { toast } from 'sonner';

import { authenticationApi } from '@/api/authentication-api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OtpInput } from '@/components/ui/otp-input';
import { Separator } from '@/components/ui/separator';
import { HttpError } from '@/lib/api';

function BackupCodesForm({
  backupCodesRemaining,
  onOpenChange,
}: {
  backupCodesRemaining: number;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [newCodes, setNewCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { mutate: regenerate, isPending } = useMutation<
    { backupCodes: string[] },
    HttpError,
    { code: string }
  >({
    mutationFn: authenticationApi.regenerateBackupCodes,
    onSuccess: (data) => {
      setNewCodes(data.backupCodes);
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      toast.success(t('Backup codes regenerated successfully'));
    },
    onError: () => {
      setError(t('Invalid code. Please try again.'));
    },
  });

  const handleOtpComplete = ({ value }: { value: string }) => {
    setError(null);
    regenerate({ code: value });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Backup Codes')}</DialogTitle>
        <DialogDescription>
          {t('Backup Codes')} ({backupCodesRemaining} {t('remaining')})
        </DialogDescription>
      </DialogHeader>

      {newCodes.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{t('Your backup codes')}</p>
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
          <Separator />
        </div>
      )}

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">{t('Regenerate Backup Codes')}</p>
        <p className="text-xs text-muted-foreground">
          {t(
            'Enter your current 6-digit authenticator code to generate new backup codes. This will invalidate all existing codes.',
          )}
        </p>
        <OtpInput onChange={handleOtpComplete} disabled={isPending} />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {t('Close')}
        </Button>
      </DialogFooter>
    </>
  );
}

function BackupCodesDialog({
  open,
  onOpenChange,
  backupCodesRemaining,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backupCodesRemaining: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <BackupCodesForm
          key={open ? 'open' : 'closed'}
          backupCodesRemaining={backupCodesRemaining}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}

BackupCodesDialog.displayName = 'BackupCodesDialog';

export { BackupCodesDialog };
