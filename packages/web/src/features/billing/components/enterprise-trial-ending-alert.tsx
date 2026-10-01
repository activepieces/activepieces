import { isNil } from '@activepieces/core-utils';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { TriangleAlert, X } from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

import { enterpriseTrialHooks } from '../hooks/enterprise-trial-hooks';
import { useManagePlanDialogStore } from '../stores/manage-plan-dialog-state';

import { EnterpriseTrialSalesLink } from './enterprise-trial-sales-link';

export function EnterpriseTrialEndingAlert() {
  const endsAt = enterpriseTrialHooks.useLiveTrialEndsAt();
  const isPlatformAdmin = useIsPlatformAdmin();
  const { openDialog: openManagePlanDialog } = useManagePlanDialogStore();
  const [dismissed, setDismissed] = useState(false);

  if (isNil(endsAt) || !isPlatformAdmin || dismissed) {
    return null;
  }
  if (dayjs(endsAt).diff(dayjs(), 'hour') > ENDING_WINDOW_HOURS) {
    return null;
  }

  return (
    <div className={cn(DASHBOARD_CONTENT_PADDING_X, 'w-full pt-3')}>
      <Alert
        variant="warning"
        className="flex items-center gap-2 bg-warning-100/10 py-2 *:[svg]:translate-y-0"
      >
        <TriangleAlert className="size-4 shrink-0" />
        <AlertDescription className="min-w-0 text-current">
          {t(
            'Your Enterprise trial ends {date}. Enterprise features will switch off after that.',
            { date: dayjs(endsAt).format('MMM D, h:mm A') },
          )}
        </AlertDescription>
        <div className="ms-auto flex shrink-0 items-center gap-1">
          <EnterpriseTrialSalesLink
            surface="enterprise_trial_ending"
            size="sm"
            label={t('Talk to sales')}
          />
          <Button size="sm" onClick={() => openManagePlanDialog()}>
            {t('Upgrade')}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={t('Dismiss')}
            className="text-current"
            onClick={() => setDismissed(true)}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </Alert>
    </div>
  );
}

const ENDING_WINDOW_HOURS = 36;
