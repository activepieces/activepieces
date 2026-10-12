import { PlatformAdminSurface } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Gem } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { ENTERPRISE_TRIAL_DAYS } from '../hooks/enterprise-trial-hooks';
import { EnterpriseAccess } from '../hooks/use-enterprise-gate';
import { usePlanTier } from '../hooks/use-plan-tier';
import { enterpriseMotion } from '../utils/enterprise-motion';
import { enterpriseTrialFeatures } from '../utils/enterprise-trial-features';
import { FeatureTier } from '../utils/feature-tier';
import { planTiers } from '../utils/plan-tiers';

import { EnterpriseTrialLockedActions } from './enterprise-trial-locked-actions';
import { FeatureKey } from './request-trial';

export function EnterpriseLockedCard({
  access,
  featureKey,
  fallbackHeadline,
  fallbackDescription,
  fallbackBenefits,
  headline: headlineOverride,
  description: descriptionOverride,
  showBenefits = false,
  surface,
  className,
}: EnterpriseLockedCardProps) {
  const copy = enterpriseTrialFeatures.lockedCopy(featureKey);
  const headline =
    headlineOverride ??
    copy?.headline ??
    fallbackHeadline ??
    enterpriseTrialFeatures.name(featureKey);
  const description =
    descriptionOverride ?? copy?.description ?? fallbackDescription;
  const benefits = showBenefits ? copy?.benefits ?? fallbackBenefits ?? [] : [];
  const plan = usePlanTier(featureKey);
  const note = noteFor({ access, tier: plan.tier });

  return (
    <Card
      role="status"
      data-slot="enterprise-locked-card"
      className={cn(
        'flex shrink-0 flex-row flex-wrap items-center gap-x-8 gap-y-4 p-5',
        enterpriseMotion.appear,
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 basis-80 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {headline && (
            <h2 className="text-base font-semibold tracking-tight text-gray-12">
              {headline}
            </h2>
          )}
          <Badge variant="info">
            <Gem />
            {plan.label}
          </Badge>
        </div>
        {description && (
          <p className="max-w-3xl text-sm text-pretty text-gray-11">
            {description}
          </p>
        )}
        {benefits.length > 0 && (
          <ul className="flex flex-col gap-1.5 pt-1.5">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-2 text-sm text-gray-12"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-accent-11" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        )}
        {note && <p className="pt-1 text-xs text-gray-11">{note}</p>}
      </div>
      <EnterpriseTrialLockedActions
        featureKey={featureKey}
        surface={surface}
        compact
      />
    </Card>
  );
}

function noteFor({
  access,
  tier,
}: {
  access: EnterpriseAccess;
  tier: FeatureTier;
}): string | null {
  switch (access) {
    case 'trial_available':
      return t(
        'Free for {days} days. No credit card, one click to start, nothing is deleted.',
        { days: ENTERPRISE_TRIAL_DAYS },
      );
    case 'ask_admin':
      return planTiers.askAdminText(tier);
    default:
      return null;
  }
}

type EnterpriseLockedCardProps = {
  access: EnterpriseAccess;
  featureKey: FeatureKey;
  fallbackHeadline?: string;
  fallbackDescription?: string;
  fallbackBenefits?: string[];
  headline?: string;
  description?: string;
  showBenefits?: boolean;
  surface: PlatformAdminSurface;
  className?: string;
};
