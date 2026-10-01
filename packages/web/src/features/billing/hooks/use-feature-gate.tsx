import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowRight, Check, Crown, ExternalLink } from 'lucide-react';
import { ReactNode, useCallback, useState } from 'react';

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
import { cn } from '@/lib/utils';

import { FeatureKey, RequestTrial } from '../components/request-trial';
import { useManagePlanDialogStore } from '../stores/manage-plan-dialog-state';
import { FeatureTier, TIER_LABELS } from '../utils/feature-tier';

export function useFeatureGate({ locked, feature }: UseFeatureGateParams) {
  const [open, setOpen] = useState(false);
  const openDialog = useCallback(() => setOpen(true), []);

  return {
    locked,
    crown: locked ? (
      <Crown className="size-3.5 shrink-0 text-on-accent/90" />
    ) : null,
    open: openDialog,
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
  featureKey,
}: UpgradeFeatureDialogProps) {
  const { openDialog: openManagePlanDialog } = useManagePlanDialogStore();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCommunity = edition === ApEdition.COMMUNITY;
  const docsUrl = documentationUrl ?? ENTERPRISE_DOCUMENTATION_URL;

  const tierLabel = isCommunity
    ? TIER_LABELS.enterprise
    : tier !== undefined
    ? TIER_LABELS[tier]
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-[28rem]">
        <DialogHeader className="gap-1.5 px-6 pt-6 text-left">
          {tierLabel !== undefined && (
            <span className="text-xs font-medium text-gray-11">
              {t('{tier} feature', { tier: tierLabel })}
            </span>
          )}
          <DialogTitle className="text-gray-12">{t(title)}</DialogTitle>
          <DialogDescription className="leading-relaxed">
            {t(description)}
          </DialogDescription>
        </DialogHeader>

        {bullets !== undefined && bullets.length > 0 && (
          <ul className="flex flex-col gap-2.5 px-6 pt-5">
            {bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-2.5 text-sm text-gray-12"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-gray-11" />
                <span>{t(bullet)}</span>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter
          className={cn(
            'mt-6 gap-3 border-t border-gray-6 px-6 py-4 sm:items-center',
            isCommunity && 'sm:justify-between',
          )}
        >
          {isCommunity ? (
            <>
              <a
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-11 hover:text-gray-12 hover:underline"
              >
                {t('Read the docs')}
                <ExternalLink className="size-3.5" />
              </a>
              <RequestTrial featureKey={featureKey} />
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                {t('Maybe later')}
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  openManagePlanDialog();
                }}
              >
                {t('Upgrade plan')}
                <ArrowRight className="size-4" />
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const ENTERPRISE_DOCUMENTATION_URL =
  'https://www.activepieces.com/docs/install/configuration/overview#enterprise-edition-optional';

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
