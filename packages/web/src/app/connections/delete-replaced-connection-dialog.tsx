import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';
import { t } from 'i18next';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { appConnectionsApi } from '@/features/connections';

function DeleteReplacedConnectionDialog({
  connection,
  onClose,
}: DeleteReplacedConnectionDialogProps) {
  return (
    <ConfirmationDeleteDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={t('Delete the old connection?')}
      message={t(
        'The replace is done. Delete {name} now, or keep it to use later.',
        { name: connection.displayName },
      )}
      mutationFn={() => appConnectionsApi.delete(connection.id)}
      entityName={t('connection')}
      buttonText={t('Delete')}
      showToast
    />
  );
}

export { DeleteReplacedConnectionDialog };

type DeleteReplacedConnectionDialogProps = {
  connection: AppConnectionWithoutSensitiveData;
  onClose: () => void;
};
