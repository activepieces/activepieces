import { Permission } from '@activepieces/core-utils';
import { t } from 'i18next';
import { Bell, Trash, UserRound } from 'lucide-react';

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/custom/item';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { alertMutations, alertQueries } from '@/features/alerts';
import { projectCollectionUtils } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';

import { AddAlertEmailForm } from './add-alert-email-form';

export const TeamProjectAlerts = () => {
  const { checkAccess } = useAuthorization();
  const { project } = projectCollectionUtils.useCurrentProject();
  const {
    data: alertsData,
    isLoading: alertsLoading,
    isError: alertsError,
  } = alertQueries.useAlertsEmailList();
  const { mutate: deleteAlert } = alertMutations.useDeleteAlert();

  const writeAlertPermission =
    checkAccess(Permission.WRITE_ALERT) &&
    checkAccess(Permission.WRITE_PROJECT);

  return (
    <>
      <Alert variant="default">
        <Bell className="inline w-4 h-4 text-amber-900" />
        <div className="flex flex-col gap-1">
          <AlertTitle>{t('Frequency')}</AlertTitle>
          <AlertDescription className="text-sm">
            {t(
              'You’ll get an email if any flow fails. Only the first failure per flow each day sends an alert. Other failures are summarized in a daily email.',
            )}
          </AlertDescription>
        </div>
      </Alert>
      <Item variant="outline" size="sm">
        <ItemMedia variant="icon">
          <UserRound />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{t('Notify flow owners')}</ItemTitle>
          <ItemDescription>
            {t(
              'Also email the flow owner when their flow fails, even if they are not in the list below.',
            )}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Switch
                  checked={project.notifyFlowOwnerOnFailure}
                  disabled={writeAlertPermission === false}
                  onCheckedChange={(checked) =>
                    projectCollectionUtils.update(project.id, {
                      notifyFlowOwnerOnFailure: checked,
                    })
                  }
                />
              </span>
            </TooltipTrigger>
            {writeAlertPermission === false && (
              <TooltipContent side="bottom">
                {t('Only project admins can do this')}
              </TooltipContent>
            )}
          </Tooltip>
        </ItemActions>
      </Item>
      <div>
        {alertsLoading && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner className="w-6 h-6" />
          </div>
        )}
        {alertsError && (
          <div className="text-center text-destructive py-8 text-sm">
            {t('Error, please try again.')}
          </div>
        )}
        {alertsData && alertsData.length === 0 && (
          <div className="text-center text-muted-foreground py-8 text-sm">
            {t('No emails added yet.')}
          </div>
        )}
        {Array.isArray(alertsData) && alertsData.length > 0 && (
          <ItemGroup className="gap-2">
            {alertsData.map((alert) => (
              <Item key={alert.id} variant="outline" size="sm">
                <ItemMedia variant="icon">
                  <Bell />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{alert.receiver}</ItemTitle>
                </ItemContent>
                <ItemActions>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0 hover:bg-destructive-50"
                        onClick={() => deleteAlert(alert)}
                        disabled={writeAlertPermission === false}
                      >
                        <Trash className="size-4 text-destructive" />
                      </Button>
                    </TooltipTrigger>
                    {writeAlertPermission === false && (
                      <TooltipContent side="bottom">
                        {t('Only project admins can do this')}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
      </div>
      <AddAlertEmailForm />
    </>
  );
};
