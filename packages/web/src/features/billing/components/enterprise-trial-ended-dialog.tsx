import { tryCatchSync } from '@activepieces/core-utils';
import { t } from 'i18next';
import { CalendarX } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { platformHooks } from '@/hooks/platform-hooks';

import { enterpriseTrialHooks } from '../hooks/enterprise-trial-hooks';
import { useManagePlanDialogStore } from '../stores/manage-plan-dialog-state';

import { EnterpriseTrialSalesLink } from './enterprise-trial-sales-link';

export function EnterpriseTrialEndedDialog() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: status } = enterpriseTrialHooks.useStatus();
  const { openDialog: openManagePlanDialog } = useManagePlanDialogStore();
  const storageKey = `${SEEN_KEY_PREFIX}${platform.id}`;
  const [seen, setSeen] = useState(() => readSeen(storageKey));

  const open = status?.state === 'ended' && !seen;
  const close = () => {
    writeSeen(storageKey);
    setSeen(true);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-w-md">
        <div className="flex flex-col gap-4">
          <span className="grid size-10 place-items-center rounded-lg bg-muted">
            <CalendarX className="size-5 text-muted-foreground" />
          </span>
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-xl">
              {t('Your Enterprise trial has ended')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'Enterprise features are now switched off. Need more time? Talk to our team to get 14 more days, or upgrade to keep everything unlocked.',
              )}
            </DialogDescription>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                close();
                openManagePlanDialog();
              }}
            >
              {t('Upgrade')}
            </Button>
            <EnterpriseTrialSalesLink surface="enterprise_trial_ended" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function readSeen(key: string): boolean {
  const { data } = tryCatchSync(() => window.localStorage.getItem(key));
  return data === 'true';
}

function writeSeen(key: string): void {
  tryCatchSync(() => window.localStorage.setItem(key, 'true'));
}

const SEEN_KEY_PREFIX = 'ap-enterprise-trial-ended-seen-';
