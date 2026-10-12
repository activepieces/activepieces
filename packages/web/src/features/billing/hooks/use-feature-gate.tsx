import { t } from 'i18next';
import { ReactNode, useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';

import { EnterpriseLockedBody } from '../components/enterprise-locked-body';
import { LockedGem } from '../components/locked-gem';
import { FeatureKey } from '../components/request-trial';
import { FeatureTier } from '../utils/feature-tier';

import { billingDialogHooks } from './billing-dialog-hooks';
import { useEnterpriseAccess } from './use-enterprise-gate';

export function useFeatureGate({ locked, feature }: UseFeatureGateParams) {
  const [open, setOpen] = useState(false);
  const access = useEnterpriseAccess({ unlocked: !locked });
  const { openDialog } = billingDialogHooks.useEnterpriseTrialDialogStore();
  const isCommunity = access === 'community';

  return {
    locked,
    crown: locked ? <LockedGem /> : null,
    open: () =>
      isCommunity
        ? setOpen(true)
        : openDialog({ featureKey: feature.featureKey }),
    dialog: isCommunity ? (
      <UpgradeFeatureDialog open={open} onOpenChange={setOpen} {...feature} />
    ) : null,
  };
}

export function UpgradeFeatureDialog({
  featureKey,
  open,
  onOpenChange,
  title,
  description,
  bullets,
}: UpgradeFeatureDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-7 sm:max-w-md sm:rounded-2xl">
        <EnterpriseLockedBody
          featureKey={featureKey}
          title={t(title)}
          description={t(description)}
          bullets={(bullets ?? []).map((bullet) => t(bullet))}
          onAction={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export type PlatformFeature = {
  featureKey: FeatureKey;
  title: string;
  description: string;
  bullets?: string[];
  tier?: FeatureTier;
  documentationUrl?: string;
  videoUrl?: string;
};

export type UseFeatureGateParams = {
  locked: boolean;
  feature: PlatformFeature;
};

export type UpgradeFeatureDialogProps = PlatformFeature & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: ReactNode;
};
