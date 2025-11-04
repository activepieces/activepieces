import { t } from 'i18next';
import { Bell, Trash } from 'lucide-react';

import { AddAlertEmailDialog } from '@/app/routes/settings/alerts/add-alert-email-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  alertQueries,
  alertMutations,
} from '@/features/alerts/lib/alert-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { Permission } from '@activepieces/shared';

export const AlertsSettings = () => {
  const { checkAccess } = useAuthorization();

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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {t('Alert Emails')}
          </CardTitle>
          <CardDescription className="text-sm">
            {t('Add email addresses to receive alerts.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="min-h-[100px]">
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
            <div className="space-y-2">
              {Array.isArray(alertsData) &&
                alertsData.map((alert) => (
                  <div
                    className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-all"
                    key={alert.id}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center">
                        <Bell className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {alert.receiver}
                        </p>
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-50"
                          onClick={() => deleteAlert(alert)}
                          disabled={writeAlertPermission === false}
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </Button>
                      </TooltipTrigger>
                      {writeAlertPermission === false && (
                        <TooltipContent side="bottom">
                          {t('Only project admins can do this')}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                ))}
            </div>
          </div>
          <AddAlertEmailDialog />
        </CardContent>
      </Card>
    </>
  );
};
