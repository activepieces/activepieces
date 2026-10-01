import { Permission } from '@activepieces/core-utils';
import { t } from 'i18next';
import { Trash2 } from 'lucide-react';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from '@/components/ui/item';
import { Spinner } from '@/components/ui/spinner';
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
      <p className="text-sm text-gray-11">
        {t(
          'An email goes out the first time each flow fails on a given day. Later failures that day are summarised in a daily email.',
        )}
      </p>
      <Panel flush>
        <SettingRows>
          <SettingRow
            title={t('Notify flow owners')}
            description={t(
              'Also email the flow owner when their flow fails, even if they are not in the list below.',
            )}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Switch
                    aria-label={t('Notify flow owners')}
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
          </SettingRow>
        </SettingRows>
      </Panel>
      <Panel
        title={t('Recipients')}
        description={t('Everyone listed here gets failure emails.')}
      >
        {alertsLoading && (
          <div className="flex items-center justify-center py-6">
            <Spinner className="text-gray-11" />
          </div>
        )}
        {alertsError && (
          <DataFetchErrorState entity={t('recipients')} className="py-6" />
        )}
        {alertsData && alertsData.length === 0 && (
          <p className="text-sm text-gray-11">{t('No one yet.')}</p>
        )}
        {Array.isArray(alertsData) && alertsData.length > 0 && (
          <ItemGroup className="rounded-xl border">
            {alertsData.map((alert) => (
              <Item key={alert.id} size="sm" className="border-0">
                <ItemContent className="min-w-0">
                  <ItemTitle className="truncate">{alert.receiver}</ItemTitle>
                </ItemContent>
                <ItemActions>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('Remove {email}', {
                          email: alert.receiver,
                        })}
                        onClick={() => deleteAlert(alert)}
                        disabled={writeAlertPermission === false}
                      >
                        <Trash2 />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {writeAlertPermission === false
                        ? t('Only project admins can do this')
                        : t('Remove')}
                    </TooltipContent>
                  </Tooltip>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
        <AddAlertEmailForm />
      </Panel>
    </>
  );
};
