import { t } from 'i18next';
import { Trash } from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { UserRowData } from '../index';

type DeleteUserActionProps = {
  row: UserRowData;
  isDeleting: boolean;
  onDelete: (id: string, isInvitation: boolean) => void;
};

export const DeleteUserAction = ({
  row,
  isDeleting,
  onDelete,
}: DeleteUserActionProps) => {
  const isInvitation = row.type === 'invitation';
  const email = row.data.email;
  const entityType = isInvitation ? t('Invitation') : t('User');

  return (
    <div className="flex items-end justify-end">
      <Tooltip>
        <TooltipTrigger>
          <ConfirmationDeleteDialog
            title={isInvitation ? t('Delete Invitation') : t('Delete User')}
            message={
              isInvitation
                ? t('This invitation will be permanently deleted.')
                : t('This user and all their data will be permanently deleted.')
            }
            entityName={`${entityType} ${email}`}
            buttonText={t('Delete')}
            mutationFn={async () => {
              onDelete(isInvitation ? row.id : row.data.id, isInvitation);
            }}
          >
            <Button loading={isDeleting} variant="ghost" className="size-8 p-0">
              <Trash className="size-4 text-destructive" />
            </Button>
          </ConfirmationDeleteDialog>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isInvitation ? t('Delete invitation') : t('Delete user')}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
