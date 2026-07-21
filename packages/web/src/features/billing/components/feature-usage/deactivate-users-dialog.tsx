import { isNil } from '@activepieces/core-utils';
import { PlatformRole, UserStatus } from '@activepieces/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';

import { platformUserApi } from '@/api/platform-user-api';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { userInvitationApi } from '@/features/members/api/user-invitation';
import {
  platformUserHooks,
  platformUserKeys,
} from '@/features/platform-admin/hooks/platform-user-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

export const DeactivateUsersDialog = ({
  open,
  onOpenChange,
  targetSeats,
  currentUsers,
  planName,
  warning,
  onConfirmed,
}: DeactivateUsersDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] gap-4">
        <DeactivateUsersForm
          key={open ? 'deactivate-open' : 'deactivate-closed'}
          targetSeats={targetSeats}
          currentUsers={currentUsers}
          planName={planName}
          warning={warning}
          onConfirmed={onConfirmed}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
};

function DeactivateUsersForm({
  targetSeats,
  currentUsers,
  planName,
  warning,
  onConfirmed,
  onOpenChange,
}: DeactivateUsersFormProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: usersPage } = platformUserHooks.useUsers();
  const { data: invitations } = platformUserHooks.usePlatformInvitations();
  const queryClient = useQueryClient();
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedInvitationIds, setSelectedInvitationIds] = useState<
    Set<string>
  >(new Set());

  const deactivatableUsers = (usersPage?.data ?? []).filter(
    (user) => user.status === UserStatus.ACTIVE && user.id !== platform.ownerId,
  );
  const pendingInvitations = invitations ?? [];

  const seatsAfter =
    currentUsers - selectedUserIds.size - selectedInvitationIds.size;
  const withinLimit = seatsAfter <= targetSeats;

  const { mutate: deactivateAndContinue, isPending } = useMutation({
    mutationFn: async () => {
      await Promise.all([
        ...Array.from(selectedUserIds).map((userId) =>
          platformUserApi.update(userId, { status: UserStatus.INACTIVE }),
        ),
        ...Array.from(selectedInvitationIds).map((invitationId) =>
          userInvitationApi.delete(invitationId),
        ),
      ]);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: platformUserKeys.users }),
        queryClient.invalidateQueries({
          queryKey: platformUserKeys.invitations,
        }),
      ]);
      onOpenChange(false);
      onConfirmed();
    },
  });

  const toggleUser = (userId: string) =>
    setSelectedUserIds((previous) => {
      const next = new Set(previous);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });

  const toggleInvitation = (invitationId: string) =>
    setSelectedInvitationIds((previous) => {
      const next = new Set(previous);
      if (next.has(invitationId)) {
        next.delete(invitationId);
      } else {
        next.add(invitationId);
      }
      return next;
    });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Deactivate users')}</DialogTitle>
        <DialogDescription>
          {isNil(planName)
            ? t(
                "You're reducing to {target, plural, =1 {1 seat} other {# seats}}. Deactivate users to get within the limit.",
                { target: targetSeats },
              )
            : t(
                'The {plan} plan includes {target, plural, =1 {1 seat} other {# seats}}. Deactivate users to get within the limit before switching.',
                { plan: planName, target: targetSeats },
              )}
        </DialogDescription>
      </DialogHeader>

      {deactivatableUsers.length > 0 && (
        <ScrollArea className="max-h-[220px] rounded-md border">
          <div className="flex flex-col p-1">
            {deactivatableUsers.map((user) => (
              <label
                key={user.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted"
              >
                <Checkbox
                  checked={selectedUserIds.has(user.id)}
                  onCheckedChange={() => toggleUser(user.id)}
                />
                <div className="min-w-0 flex-1">
                  <TextWithTooltip tooltipMessage={user.email}>
                    <p className="text-sm text-foreground">{user.email}</p>
                  </TextWithTooltip>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {roleLabel(user.platformRole)}
                </span>
              </label>
            ))}
          </div>
        </ScrollArea>
      )}

      {pendingInvitations.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {t('Pending invitations')}
          </span>
          <ScrollArea className="max-h-[160px] rounded-md border">
            <div className="flex flex-col p-1">
              {pendingInvitations.map((invitation) => (
                <label
                  key={invitation.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted"
                >
                  <Checkbox
                    checked={selectedInvitationIds.has(invitation.id)}
                    onCheckedChange={() => toggleInvitation(invitation.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <TextWithTooltip tooltipMessage={invitation.email}>
                      <p className="text-sm text-foreground">
                        {invitation.email}
                      </p>
                    </TextWithTooltip>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {t('Invited')}
                  </span>
                </label>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <span
        className={cn(
          'text-sm',
          withinLimit ? 'text-muted-foreground' : 'text-destructive',
        )}
      >
        {t("You'll be at {seatsAfter}/{target} seats after these changes.", {
          seatsAfter,
          target: targetSeats,
        })}
      </span>

      {!isNil(warning) && (
        <span className="text-xs text-destructive">{warning}</span>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          {t('Cancel')}
        </Button>
        <Button
          type="button"
          loading={isPending}
          disabled={!withinLimit}
          onClick={() => deactivateAndContinue()}
        >
          {selectedInvitationIds.size > 0 && selectedUserIds.size === 0
            ? t('Revoke & continue')
            : t('Deactivate & continue')}
        </Button>
      </DialogFooter>
    </>
  );
}

function roleLabel(role: PlatformRole): string {
  switch (role) {
    case PlatformRole.ADMIN:
      return t('Admin');
    case PlatformRole.OPERATOR:
      return t('Operator');
    default:
      return t('Member');
  }
}

type DeactivateUsersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetSeats: number;
  currentUsers: number;
  planName?: string;
  warning?: string;
  onConfirmed: () => void;
};

type DeactivateUsersFormProps = {
  targetSeats: number;
  currentUsers: number;
  planName?: string;
  warning?: string;
  onConfirmed: () => void;
  onOpenChange: (open: boolean) => void;
};
