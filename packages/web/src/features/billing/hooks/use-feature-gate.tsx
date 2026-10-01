import { Crown } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { FeatureKey } from '../components/request-trial';
import { UpgradeDialog } from '../components/upgrade-dialog';
import { FeatureTier } from '../utils/feature-tier';

export function useFeatureGate({ locked, feature }: UseFeatureGateParams) {
  const [open, setOpen] = useState(false);

  return {
    locked,
    crown: locked ? (
      <Crown className="size-3.5 shrink-0 text-on-accent/90" />
    ) : null,
    open: () => setOpen(true),
    dialog: (
      <UpgradeFeatureDialog open={open} onOpenChange={setOpen} {...feature} />
    ),
  };
}

export function UpgradeFeatureDialog({
  open,
  onOpenChange,
  ...feature
}: UpgradeFeatureDialogProps) {
  return (
    <UpgradeDialog
      open={open}
      onOpenChange={onOpenChange}
      feature={feature}
      showContactSales={false}
    />
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
