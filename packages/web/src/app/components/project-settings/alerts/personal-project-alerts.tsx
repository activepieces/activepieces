import { isNil, Permission } from '@activepieces/core-utils';
import { AlertChannel } from '@activepieces/shared';
import { t } from 'i18next';

import { alertQueries } from '@/features/alerts';
import { alertMutations } from '@/features/alerts/hooks/alert-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { userHooks } from '@/hooks/user-hooks';

import { AlertSwitchRow } from './alert-switch-row';

export const PersonalProjectAlerts = () => {
  const { checkAccess } = useAuthorization();
  const { data: currentUser } = userHooks.useCurrentUser();
  const { data: alertsData, isLoading: isLoadingAlerts } =
    alertQueries.useAlertsEmailList();

  const userEmail = currentUser?.email;
  const writeAlertPermission =
    checkAccess(Permission.WRITE_ALERT) &&
    checkAccess(Permission.WRITE_PROJECT);

  const userAlert = alertsData?.find(
    (alert) =>
      alert.channel === AlertChannel.EMAIL &&
      alert.receiver.toLowerCase() === userEmail?.toLowerCase(),
  );
  const isUserSubscribedToAlerts = !isNil(userAlert);

  const { mutate: subscribeToAlerts, isPending: isSubscribingToAlerts } =
    alertMutations.useCreateAlert();

  const { mutate: unsubscribeToAlerts, isPending: isUnsubscribingToAlerts } =
    alertMutations.useDeleteAlert();

  const isToggling = isSubscribingToAlerts || isUnsubscribingToAlerts;

  if (!userEmail) {
    return null;
  }

  const handleToggle = (next: boolean) => {
    if (next) {
      subscribeToAlerts({ email: userEmail });
      return;
    }
    if (userAlert) {
      unsubscribeToAlerts(userAlert);
    }
  };

  return (
    <AlertSwitchRow
      id="personal-alerts-switch"
      label={t('Email me when my flows fail')}
      description={t(
        'Turn off to stop receiving emails when flows in this project fail.',
      )}
      checked={isUserSubscribedToAlerts}
      disabled={isLoadingAlerts || isToggling || writeAlertPermission === false}
      onCheckedChange={handleToggle}
    />
  );
};
