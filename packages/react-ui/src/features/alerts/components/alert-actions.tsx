import { t } from 'i18next';
import { MoreVertical, Pencil, Trash } from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert } from '@activepieces/ee-shared';

import { alertMutations } from '../lib/alert-hooks';

import { CreateAlertDialog } from './create-alert-dialog';

const AlertActions = ({
  alert,
}: {
  alert: Alert;
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { mutate: deleteAlert, isPending: isDeleting } =
    alertMutations.useDeleteAlert();

  return (
    <div className="flex justify-end">
      <DropdownMenu
        modal={true}
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
      >
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 text-primary">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <CreateAlertDialog alert={alert}>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {t('Edit')}
            </DropdownMenuItem>
          </CreateAlertDialog>

          <ConfirmationDeleteDialog
            title={t('Delete Alert')}
            message={t('Are you sure you want to delete this alert?')}
            entityName="alert"
            showToast
            mutationFn={async () => {
              if (alert) {
                deleteAlert(alert);
              }
            }}
            isDanger
          >
            <DropdownMenuItem
              className="text-destructive"
              onSelect={(e) => {
                e.preventDefault();
              }}
            >
              <Trash className="h-4 w-4 mr-2" />
              {t('Delete')}
            </DropdownMenuItem>
          </ConfirmationDeleteDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default AlertActions;
