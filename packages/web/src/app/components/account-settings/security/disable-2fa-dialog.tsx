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
import { authClient } from '@/lib/better-auth';

function DisableTwoFaForm({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setError(null);
    setIsPending(true);
    try {
      const { error: apiError } = await authClient.twoFactor.disable({
        password,
      });
      if (apiError) {
        setError(t('Invalid password. Please try again.'));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      toast.success(t('Two-factor authentication has been disabled'));
      onOpenChange(false);
    } catch {
      setError(t('Invalid password. Please try again.'));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Disable Two-Factor Authentication')}</DialogTitle>
        <DialogDescription>
          {t('Enter your password to disable two-factor authentication.')}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
