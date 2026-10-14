import { isNil, unique } from '@activepieces/core-utils';
import { PlatformRole, UserInvitation, UserStatus } from '@activepieces/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { ReactNode, useState } from 'react';

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
import { internalErrorToast } from '@/components/ui/sonner';
import { userInvitationApi } from '@/features/members/api/user-invitation';
import {
  platformUserHooks,
  platformUserKeys,
} from '@/features/platform-admin/hooks/platform-user-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { refreshBillingCaches } from '../../hooks/billing-hooks';

export const DeactivateUsersDialog = ({
  open,
  onOpenChange,
  targetSeats,
  currentUsers,
  planName,
  warning,
  onConfirmed,
  enforced,
}: DeactivateUsersDialogProps) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isNil(enforced)) {
          onOpenChange(next);
        }
      }}
    >
      <DialogContent
        className="max-w-[480px] gap-4"
        showCloseButton={isNil(enforced)}
      >
        <DeactivateUsersForm
          key={open ? 'deactivate-open' : 'deactivate-closed'}
          targetSeats={targetSeats}
          currentUsers={currentUsers}
          planName={planName}
          warning={warning}
          onConfirmed={onConfirmed}
          onOpenChange={onOpenChange}
          enforced={enforced}
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
  enforced,
}: DeactivateUsersFormProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: users } = platformUserHooks.useAllUsers();
  const { data: invitations } = platformUserHooks.useInvitesReservingSeats();
  const queryClient = useQueryClient();
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

  const deactivatableUsers = (users ?? []).filter(
    (user) =>
      user.status === UserStatus.ACTIVE &&
      user.id !== platform.ownerId &&
      user.id !== enforced?.excludeUserId,
  );
  const invitedEmails = groupByEmail(invitations ?? []);
  const seatsOnlyTheOwnerCanFree =
    isNil(enforced?.excludeUserId) ||
    enforced.excludeUserId === platform.ownerId
      ? 1
      : 2;
  const ownerOnly = !isNil(enforced) && seatsOnlyTheOwnerCanFree > targetSeats;

  const usersToDeactivate = deactivatableUsers.filter((user) =>
    selectedUserIds.has(user.id),
  );
  const emailsToRevoke = invitedEmails.filter((invited) =>
    selectedEmails.has(invited.email),
  );
  const seatsAfter =
    currentUsers - usersToDeactivate.length - emailsToRevoke.length;
  const withinLimit = seatsAfter <= targetSeats;

  const refreshLists = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: platformUserKeys.users }),
      queryClient.invalidateQueries({
        queryKey: platformUserKeys.invitations,
      }),
    ]);

  const { mutate: deactivateAndContinue, isPending } = useMutation({
    mutationFn: async () => {
      const results = await Promise.allSettled([
        ...usersToDeactivate.map((user) =>
          platformUserApi.update(user.id, { status: UserStatus.INACTIVE }),
        ),
        ...emailsToRevoke.flatMap(({ invitationIds }) =>
          invitationIds.map((invitationId) =>
            userInvitationApi.delete(invitationId),
          ),
        ),
      ]);
      const failure = results.find((result) => result.status === 'rejected');
      if (!isNil(failure)) {
        throw failure.reason;
      }
    },
    onSuccess: async () => {
      await refreshLists();
      onOpenChange(false);
      onConfirmed();
    },
    onError: async () => {
      internalErrorToast();
      await refreshLists();
      refreshBillingCaches(queryClient);
    },
  });

  const toggleUser = (userId: string) =>
    setSelectedUserIds((previous) => toggled(previous, userId));

  const toggleEmail = (email: string) =>
    setSelectedEmails((previous) => toggled(previous, email));

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Deactivate users')}</DialogTitle>
        <DialogDescription>
          {enforced?.description ??
            (isNil(planName)
              ? t(
                  "You're reducing to {target, plural, =1 {1 seat} other {# seats}}. Deactivate users to get within the limit.",
                  { target: targetSeats },
                )
              : t(
                  'The {plan} plan includes {target, plural, =1 {1 seat} other {# seats}}. Deactivate users to get within the limit before switching.',
                  { plan: planName, target: targetSeats },
                ))}
        </DialogDescription>
      </DialogHeader>

      {ownerOnly ? (
        <p className="text-sm text-gray-11">{enforced?.ownerOnlyMessage}</p>
      ) : (
        <SeatChoices
          users={deactivatableUsers.map((user) => ({
            id: user.id,
            email: user.email,
            trailingLabel: roleLabel(user.platformRole),
          }))}
          invitations={invitedEmails.map(({ email }) => ({
            id: email,
            email,
            trailingLabel: t('Invited'),
          }))}
          selectedUserIds={selectedUserIds}
          selectedEmails={selectedEmails}
          onToggleUser={toggleUser}
          onToggleEmail={toggleEmail}
          seatsAfter={seatsAfter}
          targetSeats={targetSeats}
          withinLimit={withinLimit}
          warning={warning}
        />
      )}

      <DialogFooter>
        {isNil(enforced) ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t('Cancel')}
          </Button>
        ) : (
          enforced.actions
        )}
        {!ownerOnly && (
          <Button
            {...adminControl(AdminControl.BILLING_DEACTIVATE_USERS_SUBMIT)}
            type="button"
            loading={isPending}
            disabled={!withinLimit}
            onClick={() => deactivateAndContinue()}
          >
            {emailsToRevoke.length > 0 && usersToDeactivate.length === 0
              ? t('Revoke & continue')
              : t('Deactivate & continue')}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

function SeatChoices({
  users,
  invitations,
  selectedUserIds,
  selectedEmails,
  onToggleUser,
  onToggleEmail,
  seatsAfter,
  targetSeats,
  withinLimit,
  warning,
}: SeatChoicesProps) {
  return (
    <>
      <SelectableEmailList
        items={users}
        selectedIds={selectedUserIds}
        onToggle={onToggleUser}
        maxHeightClass="max-h-[220px]"
      />

      <SelectableEmailList
        heading={t('Pending invitations')}
        items={invitations}
        selectedIds={selectedEmails}
        onToggle={onToggleEmail}
        maxHeightClass="max-h-[160px]"
      />

      <span
        className={cn(
          'text-sm',
          withinLimit ? 'text-gray-11' : 'text-danger-11',
        )}
      >
        {t("You'll be at {seatsAfter}/{target} seats after these changes.", {
          seatsAfter,
          target: targetSeats,
        })}
      </span>

      {!isNil(warning) && (
        <span className="text-xs text-danger-11">{warning}</span>
      )}
    </>
  );
}

function SelectableEmailList({
  items,
  selectedIds,
  onToggle,
  maxHeightClass,
  heading,
}: SelectableEmailListProps) {
  if (items.length === 0) {
    return null;
  }

  const list = (
    <ScrollArea className={cn('rounded-md border', maxHeightClass)}>
      <div className="flex flex-col p-1">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-gray-3"
          >
            <Checkbox
              checked={selectedIds.has(item.id)}
              onCheckedChange={() => onToggle(item.id)}
            />
            <div className="min-w-0 flex-1">
              <TextWithTooltip tooltipMessage={item.email}>
                <p className="text-sm text-gray-12">{item.email}</p>
              </TextWithTooltip>
            </div>
            <span className="shrink-0 text-xs text-gray-11">
              {item.trailingLabel}
            </span>
          </label>
        ))}
      </div>
    </ScrollArea>
  );

  if (isNil(heading)) {
    return list;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-gray-11">{heading}</span>
      {list}
    </div>
  );
}

function toggled(selectedIds: Set<string>, id: string): Set<string> {
  const next = new Set(selectedIds);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

function groupByEmail(invitations: UserInvitation[]): InvitedEmail[] {
  const emails = unique(
    invitations.map((invitation) => invitation.email.toLowerCase()),
  );
  return emails.map((email) => ({
    email,
    invitationIds: invitations
      .filter((invitation) => invitation.email.toLowerCase() === email)
      .map((invitation) => invitation.id),
  }));
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
  enforced?: EnforcedSeatFloor;
};

type EnforcedSeatFloor = {
  description: string;
  ownerOnlyMessage: string;
  excludeUserId: string | null;
  actions: ReactNode;
};

type DeactivateUsersFormProps = Omit<DeactivateUsersDialogProps, 'open'>;

type SeatChoicesProps = {
  users: SelectableEmailItem[];
  invitations: SelectableEmailItem[];
  selectedUserIds: Set<string>;
  selectedEmails: Set<string>;
  onToggleUser: (id: string) => void;
  onToggleEmail: (email: string) => void;
  seatsAfter: number;
  targetSeats: number;
  withinLimit: boolean;
  warning?: string;
};

type InvitedEmail = {
  email: string;
  invitationIds: string[];
};

type SelectableEmailItem = {
  id: string;
  email: string;
  trailingLabel: string;
};

type SelectableEmailListProps = {
  items: SelectableEmailItem[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  maxHeightClass: string;
  heading?: string;
};
