import { t } from 'i18next';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  alertQueries,
} from '@/features/alerts/lib/alert-hooks';
import { AlertsTable } from '@/features/alerts/components/alerts-table';
import { CreateAlertDialog } from '@/features/alerts/components/create-alert-dialog';

export const AlertsSettings = () => {
  const {
    data: alertsData,
    isLoading: alertsLoading,
    isError: alertsError,
  } = alertQueries.useAlertsEmailList();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('Alerts')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('Manage your alert notifications')}
          </p>
        </div>
        <CreateAlertDialog alert={null}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {t('Create Alert')}
          </Button>
        </CreateAlertDialog>
      </div>
      
      <AlertsTable
        alerts={alertsData}
        isLoading={alertsLoading}
        isError={alertsError}
      />
    </div>
  );
};
