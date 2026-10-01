import { PlatformRole, UserStatus } from '@activepieces/shared';
import { t } from 'i18next';
import {
  CircleMinus,
  MoreVertical,
  Pencil,
  RotateCcw,
  Trash,
} from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
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
            <MoreVertical className="h-4 w-4" />
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
                <Pencil className="h-4 w-4" />
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
                <CircleMinus className="h-4 w-4" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              {isActive ? t('Deactivate') : t('Activate')}
            </DropdownMenuItem>
          )}
          <ConfirmDialog
            title={t('Delete {name}?', { name: row.data.email })}
            description={
              isInvitation
                ? t('This invitation will be permanently deleted.')
                : t('This user and all their data will be permanently deleted.')
            }
            onConfirm={async () => {
              onDelete(isInvitation ? row.id : row.data.id, isInvitation);
            }}
            confirmLabel={t('Delete')}
          >
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => e.preventDefault()}
            >
              <Trash className="h-4 w-4" />
              {t('Delete')}
            </DropdownMenuItem>
          </ConfirmDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
