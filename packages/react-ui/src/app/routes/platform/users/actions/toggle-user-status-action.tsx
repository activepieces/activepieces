import { t } from 'i18next';
import { CircleMinus, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PlatformRole, UserStatus } from '@activepieces/shared';

import { UserRowData } from '../index';

type ToggleUserStatusActionProps = {
  row: UserRowData;
  isUpdatingStatus: boolean;
  onToggleStatus: (userId: string, currentStatus: UserStatus) => void;
};

export const ToggleUserStatusAction = ({
  row,
  isUpdatingStatus,
  onToggleStatus,
}: ToggleUserStatusActionProps) => {
  if (row.type === 'invitation') {
    return null;
  }

  const isAdmin = row.data.platformRole === PlatformRole.ADMIN;
  const isActive = row.data.status === UserStatus.ACTIVE;

  return (
    <div className="flex items-end justify-end">
      <Tooltip>
        <TooltipTrigger>
          <Button
            disabled={isUpdatingStatus || isAdmin}
            variant="ghost"
            className="size-8 p-0"
            loading={isUpdatingStatus}
            onClick={() => {
              onToggleStatus(row.data.id, row.data.status);
            }}
          >
            {isActive ? (
              <CircleMinus className="size-4" />
            ) : (
              <RotateCcw className="size-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isAdmin
            ? t('Admin cannot be deactivated')
            : isActive
            ? t('Deactivate user')
            : t('Activate user')}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
