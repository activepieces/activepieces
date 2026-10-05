import { EventDestination } from '@activepieces/shared';
import { t } from 'i18next';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { INTERNAL_ERROR_MESSAGE } from '@/components/ui/sonner';
import { api } from '@/lib/api';

import { eventDestinationsCollectionUtils } from '../lib/event-destinations-collection';

export const DeleteDestinationDialog = ({
  destination,
  onOpenChange,
}: DeleteDestinationDialogProps) => (
  <ConfirmDialog
    open
    onOpenChange={onOpenChange}
    title={t('Delete destination?')}
    description={t('Events stop being sent here immediately.')}
    confirmLabel={t('Delete')}
    successMessage={t('Deleted {name}', { name: t('destination') })}
    onConfirm={async () => {
      await eventDestinationsCollectionUtils.delete([destination.id])
        .isPersisted.promise;
    }}
    onError={(error) => {
      toast.error(t('Error'), {
        description: api.extractServerErrorMessage(
          error,
          INTERNAL_ERROR_MESSAGE,
        ),
      });
    }}
  />
);

type DeleteDestinationDialogProps = {
  destination: EventDestination;
  onOpenChange: (open: boolean) => void;
};
