import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
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
import { twoFactorMutations, twoFactorUtils } from '@/features/authentication';

function DisableTwoFaForm({
  onOpenChange,
  hasPassword,
}: {
  onOpenChange: (open: boolean) => void;
  hasPassword: boolean;
}) {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const disableMutation = twoFactorMutations.useDisable({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      toast.success(t('Two-factor authentication has been disabled'));
      onOpenChange(false);
    },
    onError: (err) => {
      setError(twoFactorUtils.extractErrorMessage(err));
    },
  });

  const verifyTotpMutation = twoFactorMutations.useVerifyTotp({
    onSuccess: () => {
      disableMutation.mutate({});
    },
    onError: (err) => {
      setError(twoFactorUtils.extractErrorMessage(err));
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setError(null);
    disableMutation.mutate({ password });
  };

  const handleOtpComplete = ({ value }: { value: string }) => {
    setError(null);
    verifyTotpMutation.mutate({ code: value });
  };

  const isPending = disableMutation.isPending || verifyTotpMutation.isPending;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Disable Two-Factor Authentication')}</DialogTitle>
        <DialogDescription>
          {hasPassword
            ? t('Enter your password to disable two-factor authentication.')
            : t(
                'Enter your authenticator code to disable two-factor authentication.',
              )}
        </DialogDescription>
      </DialogHeader>

      {hasPassword ? (
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="disable-2fa-password">{t('Password')}</Label>
            <Input
              id="disable-2fa-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="submit"
              variant="destructive"
              loading={isPending}
              disabled={!password}
            >
              {t('Disable 2FA')}
            </Button>
          </DialogFooter>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <OtpInput
            onChange={handleOtpComplete}
            disabled={isPending}
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}
    </>
  );
}

function DisableTwoFaDialog({
  open,
  onOpenChange,
  hasPassword,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasPassword: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DisableTwoFaForm
          key={open ? 'open' : 'closed'}
          onOpenChange={onOpenChange}
          hasPassword={hasPassword}
        />
      </DialogContent>
    </Dialog>
  );
}

DisableTwoFaDialog.displayName = 'DisableTwoFaDialog';

export { DisableTwoFaDialog };
