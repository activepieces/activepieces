import { AlertChannel, isNil, Permission } from '@activepieces/shared';
import { t } from 'i18next';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { alertQueries } from '@/features/alerts';
import { alertMutations } from '@/features/alerts/hooks/alert-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { userHooks } from '@/hooks/user-hooks';

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
    <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor="personal-alerts-switch" className="text-sm">
          {t('Email me when my flows fail')}
        </Label>
        <span className="text-xs text-muted-foreground">
          {t(
            'Turn off to stop receiving emails when flows in this project fail.',
          )}
        </span>
      </div>
      <Switch
        id="personal-alerts-switch"
        checked={isUserSubscribedToAlerts}
        disabled={
          isLoadingAlerts || isToggling || writeAlertPermission === false
        }
        onCheckedChange={handleToggle}
      />
    </div>
  );
};
