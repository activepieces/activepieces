import { PLATFORM_PURGE_DELAY_DAYS } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { platformHooks } from '@/hooks/platform-hooks';

export const DeletePlatformDialog = ({
  platformName,
  open,
  onOpenChange,
}: DeletePlatformDialogProps) => {
  const confirmationTarget =
    platformName.trim().length > 0
      ? platformName.trim()
      : FALLBACK_CONFIRMATION;
  const { mutateAsync: deletePlatform } = platformHooks.useDeletePlatform();
  const purgeDate = dayjs()
    .add(PLATFORM_PURGE_DELAY_DAYS, 'day')
    .format('MMMM D, YYYY');

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('Delete {name}?', { name: confirmationTarget })}
      description={
        <span className="flex flex-col gap-2">
          <span>
            {t('{name} will be deleted for everyone. This cannot be undone.', {
              name: confirmationTarget,
            })}
          </span>
          <span>
            {t(
              'Your projects, flows, connections, agents and tables are erased on {date}.',
              { date: purgeDate },
            )}
          </span>
        </span>
      }
      consequence={t(
        'Access ends the moment you confirm: everyone is signed out, every flow stops running, and all API keys stop working.',
      )}
      confirmLabel={t('Delete platform')}
      typeToConfirm={confirmationTarget}
      onConfirm={() => deletePlatform()}
    />
  );
};

const FALLBACK_CONFIRMATION = 'delete platform';

type DeletePlatformDialogProps = {
  platformName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
