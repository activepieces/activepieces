import { PlatformAdminSurface } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Gem } from 'lucide-react';

import { DialogDescription, DialogTitle } from '@/components/ui/dialog';

import { enterpriseTrialFeatures } from '../utils/enterprise-trial-features';

import { EnterpriseTrialLockedActions } from './enterprise-trial-locked-actions';
import { FeatureKey } from './request-trial';

export function EnterpriseLockedBody({
  featureKey,
  title,
  description,
  bullets,
  onAction,
}: EnterpriseLockedBodyProps) {
  const copy = enterpriseTrialFeatures.lockedCopy(featureKey);
  const headline =
    copy?.headline ??
    title ??
    enterpriseTrialFeatures.name(featureKey) ??
    t('The Enterprise plan for your whole team');
  const body =
    copy?.description ??
    description ??
    t(
      'Single sign-on, audit logs, your own AI providers and more, for everyone on your platform.',
    );
  const benefits = copy?.benefits ?? bullets ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 pr-6">
        <span className="flex items-center gap-2 text-sm font-medium text-accent-11">
          <Gem className="size-4" />
          {t('Included in the Enterprise plan')}
        </span>
        <DialogTitle className="text-xl font-semibold tracking-tight text-gray-12">
          {headline}
        </DialogTitle>
        <DialogDescription className="text-base text-pretty">
          {body}
        </DialogDescription>
      </div>
      {benefits.length > 0 && (
        <ul className="flex flex-col gap-2.5 border-y py-5">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2.5 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-success-11" />
              <span className="text-gray-12">{benefit}</span>
            </li>
          ))}
        </ul>
      )}
      <EnterpriseTrialLockedActions
        featureKey={featureKey}
        surface={PlatformAdminSurface.DIALOG}
        onAction={onAction}
      />
    </div>
  );
}

type EnterpriseLockedBodyProps = {
  featureKey?: FeatureKey;
  title?: string;
  description?: string;
  bullets?: string[];
  onAction?: () => void;
};
