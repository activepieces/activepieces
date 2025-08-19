import { t } from 'i18next';
import { Trash } from 'lucide-react';

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
import { Alert } from '@activepieces/ee-shared';
import { Permission } from '@activepieces/shared';

import { AddAlertEmailDialog } from './add-alert-email-dialog';

export default function AlertsEmailsCard() {
  const { data, isLoading, isError, isSuccess } =
    alertQueries.useAlertsEmailList();
  const { mutate: deleteAlert } = alertMutations.useDeleteAlert();

  const { checkAccess } = useAuthorization();
  const writeAlertPermission = checkAccess(Permission.WRITE_ALERT);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">{t('Emails')}</CardTitle>
        <CardDescription>
          {t('Add email addresses to receive alerts.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="min-h-[35px]">
          {isLoading && (
            <div className="flex items-center justify-center">
              <LoadingSpinner />
            </div>
          )}
          {isError && <div>{t('Error, please try again.')}</div>}
          {isSuccess && data.length === 0 && (
            <div className="text-center">{t('No emails added yet.')}</div>
          )}
          {Array.isArray(data) &&
            data.map((alert: Alert) => (
              <div
                className="flex items-center justify-between space-x-4"
                key={alert.id}
              >
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {alert.receiver}
                    </p>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        variant="ghost"
                        className="size-8 p-0"
                        onClick={() => deleteAlert(alert)}
                        disabled={writeAlertPermission === false}
                      >
                        <Trash className="size-4 text-destructive" />
                      </Button>
                    </div>
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
        <AddAlertEmailDialog />
      </CardContent>
    </Card>
  );
}
