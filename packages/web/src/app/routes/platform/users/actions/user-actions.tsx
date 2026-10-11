import {
  PlatformRole,
  UserStatus,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  CircleMinus,
  MoreVertical,
  Pencil,
  RotateCcw,
  Trash,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { userHooks } from '@/hooks/user-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { UserRowData } from '../index';

import { UpdateUserDialog } from './update-user-dialog';

type UserActionsProps = {
  row: UserRowData;
  isUpdatingStatus: boolean;
  onDelete: (row: UserRowData) => void;
  onToggleStatus: (user: UserWithMetaInformation) => void;
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
  const { data: currentUser } = userHooks.useCurrentUser();
  const isInvitation = row.type === 'invitation';
  const isSelf = !isInvitation && row.data.id === currentUser?.id;
  const isAdmin = !isInvitation && row.data.platformRole === PlatformRole.ADMIN;
  const isActive = !isInvitation && row.data.status === UserStatus.ACTIVE;

  return (
    <div className="flex justify-end">
      <DropdownMenu modal={true} open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {!isInvitation && (
            <UpdateUserDialog
              userId={row.data.id}
              email={row.data.email}
              role={row.data.platformRole}
              externalId={row.data.externalId ?? undefined}
              onUpdate={onUpdate}
            >
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                {...adminControl(AdminControl.USERS_EDIT_OPEN)}
              >
                <Pencil className="h-4 w-4" />
                {t('Edit')}
              </DropdownMenuItem>
            </UpdateUserDialog>
          )}
          {!isInvitation && (
            <DropdownMenuItem
              disabled={isAdmin || isUpdatingStatus}
              onSelect={() => {
                onToggleStatus(row.data);
                setOpen(false);
              }}
              {...adminControl(
                isActive
                  ? AdminControl.USERS_DEACTIVATE_RUN
                  : AdminControl.USERS_ACTIVATE_RUN,
              )}
            >
              {isActive ? (
                <CircleMinus className="h-4 w-4" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              {isActive ? t('Deactivate') : t('Activate')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            variant="destructive"
            disabled={isSelf}
            onSelect={() => {
              onDelete(row);
              setOpen(false);
            }}
            {...adminControl(AdminControl.USERS_DELETE_OPEN)}
          >
            <Trash className="h-4 w-4" />
            {t('Delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
