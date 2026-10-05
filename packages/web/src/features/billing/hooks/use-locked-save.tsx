import { PlatformAdminSurface } from '@activepieces/shared';
import { t } from 'i18next';
import { Crown } from 'lucide-react';
import { useState } from 'react';

import type { SaveBarLock } from '@/components/custom/settings-parts';
import { Button } from '@/components/ui/button';

import { usePlanTarget } from '../components/plan-locked-panel';
import { UpgradeDialog } from '../components/upgrade-dialog';
import { TIER_LABELS } from '../utils/feature-tier';

import type { PlatformFeature } from './use-feature-gate';

export function useLockedSave({ feature }: UseLockedSaveParams): SaveBarLock {
  const [open, setOpen] = useState(false);
  const tier = usePlanTarget(feature);
  return {
    message: t("Available on the {tier} plan. This preview isn't saved.", {
      tier: TIER_LABELS[tier],
    }),
    upgradeAction: (
      <>
        <Button type="button" onClick={() => setOpen(true)}>
          <Crown />
          {t('Upgrade to save')}
        </Button>
        <UpgradeDialog
          open={open}
          onOpenChange={setOpen}
          feature={feature}
          surface={PlatformAdminSurface.SAMPLE}
        />
      </>
    ),
  };
}

export type UseLockedSaveParams = {
  feature: PlatformFeature;
};
