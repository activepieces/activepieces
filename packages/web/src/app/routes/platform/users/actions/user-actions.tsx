import { PlatformRole, UserStatus } from '@activepieces/shared';
import {
  Delete02Icon,
  MoreVerticalIcon,
  PencilEdit01Icon,
  RemoveCircleIcon,
  RotateCcwIcon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { UserRowData } from '../index';

import { UpdateUserDialog } from './update-user-dialog';

type UserActionsProps = {
  row: UserRowData;
  isUpdatingStatus: boolean;
  onDelete: (id: string, isInvitation: boolean) => void;
  onToggleStatus: (userId: string, currentStatus: UserStatus) => void;
  onUpdate: () => void;
};

export const UserActions = ({
  row,
  isUpdatingStatus,
  onDelete,
  onToggleStatus,
  onUpdate,
}: UserActionsProps) => {
  const [open, setOpen] = useState(false);
  const isInvitation = row.type === 'invitation';
  const isAdmin = !isInvitation && row.data.platformRole === PlatformRole.ADMIN;
  const isActive = !isInvitation && row.data.status === UserStatus.ACTIVE;

  return (
    <div className="flex justify-end">
      <DropdownMenu modal={true} open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <HugeiconsIcon icon={MoreVerticalIcon} className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {!isInvitation && (
            <UpdateUserDialog
              userId={row.data.id}
              role={row.data.platformRole}
              externalId={row.data.externalId ?? undefined}
              onUpdate={onUpdate}
            >
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4" />
                {t('Edit')}
              </DropdownMenuItem>
            </UpdateUserDialog>
          )}
          {!isInvitation && (
            <DropdownMenuItem
              disabled={isAdmin || isUpdatingStatus}
              onSelect={() => {
                onToggleStatus(row.data.id, row.data.status);
                setOpen(false);
              }}
            >
              {isActive ? (
                <HugeiconsIcon icon={RemoveCircleIcon} className="h-4 w-4" />
              ) : (
                <HugeiconsIcon icon={RotateCcwIcon} className="h-4 w-4" />
              )}
              {isActive ? t('Deactivate') : t('Activate')}
            </DropdownMenuItem>
          )}
          <ConfirmationDeleteDialog
            title={isInvitation ? t('Delete Invitation') : t('Delete User')}
            message={
              isInvitation
                ? t('This invitation will be permanently deleted.')
                : t('This user and all their data will be permanently deleted.')
            }
            entityName={`${isInvitation ? t('Invitation') : t('User')} ${
              row.data.email
            }`}
            mutationFn={async () => {
              onDelete(isInvitation ? row.id : row.data.id, isInvitation);
            }}
          >
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => e.preventDefault()}
            >
              <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
              {t('Delete')}
            </DropdownMenuItem>
          </ConfirmationDeleteDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
