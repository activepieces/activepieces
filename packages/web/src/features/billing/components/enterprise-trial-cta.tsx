import { t } from 'i18next';
import { Sparkles } from 'lucide-react';
import { cloneElement, isValidElement, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import {
  ENTERPRISE_TRIAL_DAYS,
  enterpriseTrialHooks,
} from '../hooks/enterprise-trial-hooks';
import { useEnterpriseTrialDialogStore } from '../stores/enterprise-trial-dialog-state';

import { FeatureKey } from './request-trial';

export function EnterpriseTrialCta({
  featureKey,
  fallback,
  className,
  appearance = 'button',
  onBeforeOpen,
}: EnterpriseTrialCtaProps) {
  const offerTrial = enterpriseTrialHooks.useOffer();
  const { openDialog } = useEnterpriseTrialDialogStore();
  if (!offerTrial) {
    return fallback;
  }
  const open = () => {
    onBeforeOpen?.();
    openDialog({ featureKey });
  };
  if (appearance === 'link') {
    return (
      <>
        {fallback}
        <span className="text-gray-11">{t('or')}</span>
        <button
          type="button"
          onClick={open}
          className="font-medium text-accent-11 hover:underline"
        >
          {t('start a free {days}-day trial', {
            days: ENTERPRISE_TRIAL_DAYS,
          })}
        </button>
      </>
    );
  }
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Button type="button" className="gap-2" onClick={open}>
        <Sparkles className="size-4" />
        {t('Start free trial')}
      </Button>
      {asSecondary(fallback)}
    </div>
  );
}

function asSecondary(node: ReactNode): ReactNode {
  if (isValidElement<{ variant?: string }>(node) && node.type === Button) {
    return cloneElement(node, { variant: 'outline' });
  }
  return node;
}

type EnterpriseTrialCtaProps = {
  featureKey?: FeatureKey;
  fallback: ReactNode;
  className?: string;
  appearance?: 'button' | 'link';
  onBeforeOpen?: () => void;
};
