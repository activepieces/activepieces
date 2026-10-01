import { t } from 'i18next';
import { Sparkles } from 'lucide-react';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { enterpriseTrialHooks } from '../hooks/enterprise-trial-hooks';
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
        <span className="text-muted-foreground">{t('or')}</span>
        <button
          type="button"
          onClick={open}
          className="font-medium text-primary hover:underline"
        >
          {t('start a free 7-day trial')}
        </button>
      </>
    );
  }
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {fallback}
      <Button type="button" variant="outline" className="gap-2" onClick={open}>
        <Sparkles className="size-4" />
        {t('Start free trial')}
      </Button>
    </div>
  );
}

type EnterpriseTrialCtaProps = {
  featureKey?: FeatureKey;
  fallback: ReactNode;
  className?: string;
  appearance?: 'button' | 'link';
  onBeforeOpen?: () => void;
};
