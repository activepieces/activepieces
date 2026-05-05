import { Alert, AlertChannel, Permission } from '@activepieces/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';

import { Label } from '@/components/ui/label';
import { internalErrorToast } from '@/components/ui/sonner';
import { Switch } from '@/components/ui/switch';
import { alertQueries } from '@/features/alerts';
import { alertsApi } from '@/features/alerts/api/alerts-api';
import { alertsKeys } from '@/features/alerts/hooks/alert-hooks';
import { projectCollectionUtils } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { userHooks } from '@/hooks/user-hooks';

export const PersonalProjectAlerts = () => {
  const { checkAccess } = useAuthorization();
  const queryClient = useQueryClient();
  const { project: currentProject } =
    projectCollectionUtils.useCurrentProject();
  const { data: currentUser } = userHooks.useCurrentUser();
  const { data: alertsData } = alertQueries.useAlertsEmailList();

  const userEmail = currentUser?.email;
  const writeAlertPermission =
    checkAccess(Permission.WRITE_ALERT) &&
    checkAccess(Permission.WRITE_PROJECT);

  const myAlert = alertsData?.find(
    (alert) =>
      alert.channel === AlertChannel.EMAIL && alert.receiver === userEmail,
  );
  const isMySubscriptionOn = !!myAlert;

  const invalidateAlerts = () =>
    queryClient.invalidateQueries({ queryKey: alertsKeys.all });

  const { mutate: subscribe, isPending: isSubscribing } = useMutation<
    Alert,
    Error,
    { email: string; projectId: string }
  >({
    mutationFn: ({ email, projectId }) =>
      alertsApi.create({
        receiver: email,
        projectId,
        channel: AlertChannel.EMAIL,
      }),
    onSuccess: invalidateAlerts,
    onError: () => internalErrorToast(),
  });

  const { mutate: unsubscribe, isPending: isUnsubscribing } = useMutation<
    void,
    Error,
    string
  >({
    mutationFn: (alertId) => alertsApi.delete(alertId),
    onSuccess: invalidateAlerts,
    onError: () => internalErrorToast(),
  });

  const isToggling = isSubscribing || isUnsubscribing;

  if (!userEmail) {
    return null;
  }

  const handleToggle = (next: boolean) => {
    if (next) {
      subscribe({ email: userEmail, projectId: currentProject.id });
      return;
    }
    if (myAlert) {
      unsubscribe(myAlert.id);
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
        checked={isMySubscriptionOn}
        disabled={isToggling || writeAlertPermission === false}
        onCheckedChange={handleToggle}
      />
    </div>
  );
};
