import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Crown, ExternalLink } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { flagsHooks } from '@/hooks/flags-hooks';

import { useManagePlanDialogStore } from '../stores/manage-plan-dialog-state';
import { FeatureTier, TIER_LABELS } from '../utils/feature-tier';

export function useFeatureGate({ locked, feature }: UseFeatureGateParams) {
  const [open, setOpen] = useState(false);

  return {
    locked,
    crown: locked ? (
      <Crown className="size-3.5 shrink-0 text-primary-foreground/90" />
    ) : null,
    open: () => setOpen(true),
    intercept: (handler?: () => void) =>
      locked ? () => setOpen(true) : handler,
    dialog: (
      <UpgradeFeatureDialog open={open} onOpenChange={setOpen} {...feature} />
    ),
  };
}

export function UpgradeFeatureDialog({
  open,
  onOpenChange,
  title,
  description,
  bullets,
  tier,
  documentationUrl,
}: UpgradeFeatureDialogProps) {
  const { openDialog: openManagePlanDialog } = useManagePlanDialogStore();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCommunity = edition === ApEdition.COMMUNITY;
  const docsUrl = documentationUrl ?? ENTERPRISE_DOCUMENTATION_URL;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[28rem]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title}
            {tier !== undefined && !isCommunity && (
              <Badge variant="outline">{TIER_LABELS[tier]}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {isCommunity
              ? t('This is an Enterprise feature, available on our paid plans.')
              : description}
          </DialogDescription>
        </DialogHeader>

        {!isCommunity && bullets !== undefined && bullets.length > 0 && (
          <ul className="flex flex-col gap-2">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter className="sm:justify-start">
          {isCommunity ? (
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t('Read the docs')}
              <ExternalLink className="size-3.5" />
            </a>
          ) : (
            <Button
              onClick={() => {
                onOpenChange(false);
                openManagePlanDialog();
              }}
            >
              {t('Upgrade plan')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const ENTERPRISE_DOCUMENTATION_URL =
  'https://www.activepieces.com/docs/install/configuration/overview#enterprise-edition-optional';

export type PlatformFeature = {
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
