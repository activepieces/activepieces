import { EventDestination } from '@activepieces/shared';
import { t } from 'i18next';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { AdminControl } from '@/lib/admin-control';

import { eventDestinationsCollectionUtils } from '../lib/event-destinations-collection';

export const DeleteDestinationDialog = ({
  destination,
  title,
  open,
  onOpenChange,
  onDeleted,
}: {
  destination: EventDestination;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) => {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('Delete {name}?', { name: title })}
      description={t(
        'Events stop going to this destination. This cannot be undone.',
      )}
      consequence={
        Object.keys(destination.headers ?? {}).length > 0
          ? t(
              'Its saved header values are deleted too and cannot be read back.',
            )
          : undefined
      }
      confirmLabel={t('Delete destination')}
      successMessage={t('Destination deleted')}
      errorTitle={t("Couldn't delete the destination")}
      controlId={AdminControl.EVENT_DESTINATIONS_DESTINATION_DELETE_CONFIRM}
      onConfirm={async () => {
        await eventDestinationsCollectionUtils.delete([destination.id]);
        onDeleted?.();
      }}
    />
  );
};
