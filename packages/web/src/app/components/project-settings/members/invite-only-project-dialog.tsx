import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { internalErrorToast } from '@/components/ui/sonner';
import { userInvitationApi } from '@/features/members/api/user-invitation';

export function InviteOnlyProjectDialog({
  open,
  onOpenChange,
  invitationId,
  email,
  projectName,
  onRevoked,
}: InviteOnlyProjectDialogProps) {
  const { mutate: revoke, isPending } = useMutation({
    mutationFn: () => userInvitationApi.delete(invitationId),
    onSuccess: () => {
      onOpenChange(false);
      onRevoked();
    },
    onError: () => internalErrorToast(),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="mb-0">
          <DialogTitle>
            {t('{projectName} is their only project', { projectName })}
          </DialogTitle>
          <DialogDescription className="pt-1">
            {t(
              "New members don't get a personal project, so {email} would join with nowhere to work. Revoke the invite instead, or invite them again with another project.",
              { email },
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button
            variant="destructive"
            loading={isPending}
            onClick={() => revoke()}
          >
            {t('Revoke invite')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type InviteOnlyProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitationId: string;
  email: string;
  projectName: string;
  onRevoked: () => void;
};
