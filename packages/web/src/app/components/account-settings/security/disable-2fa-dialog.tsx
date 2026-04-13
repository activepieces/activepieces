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
import { Input } from '@/components/ui/input';
import { OtpInput } from '@/components/ui/otp-input';
import { HttpError } from '@/lib/api';

function DisableTwoFaForm({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { mutate: disable2fa, isPending } = useMutation<
    void,
    HttpError,
    { code: string }
  >({
    mutationFn: authenticationApi.disable2fa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      toast.success(t('Two-factor authentication has been disabled'));
      onOpenChange(false);
    },
    onError: () => {
      setError(t('Invalid code. Please try again.'));
    },
  });

  const handleOtpComplete = ({ value }: { value: string }) => {
    setError(null);
    disable2fa({ code: value });
  };

  const handleBackupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupCode.trim()) return;
    setError(null);
    disable2fa({ code: backupCode.trim() });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Disable Two-Factor Authentication')}</DialogTitle>
        <DialogDescription>
          {t('Enter your authenticator code to disable 2FA.')}
        </DialogDescription>
      </DialogHeader>

      {!useBackupCode ? (
        <div className="flex flex-col gap-4">
          <OtpInput
            onChange={handleOtpComplete}
            disabled={isPending}
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
            onClick={() => {
              setUseBackupCode(true);
              setError(null);
            }}
          >
            {t('Use a backup code instead')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleBackupSubmit} className="flex flex-col gap-4">
          <Input
            type="text"
            placeholder="xxxxxxxx"
            value={backupCode}
            onChange={(e) => setBackupCode(e.target.value)}
            disabled={isPending}
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors mr-auto"
              onClick={() => {
                setUseBackupCode(false);
                setError(null);
                setBackupCode('');
              }}
            >
              {t('Use authenticator code instead')}
            </button>
            <Button
              type="submit"
              variant="destructive"
              loading={isPending}
              disabled={!backupCode.trim()}
            >
              {t('Disable 2FA')}
            </Button>
          </DialogFooter>
        </form>
      )}
    </>
  );
}

function DisableTwoFaDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DisableTwoFaForm
          key={open ? 'open' : 'closed'}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}

DisableTwoFaDialog.displayName = 'DisableTwoFaDialog';

export { DisableTwoFaDialog };
