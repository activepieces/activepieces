import { PlatformAdminSurface } from '@activepieces/shared';
import { Check } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { enterpriseMotion } from '../utils/enterprise-motion';
import { enterpriseTrialFeatures } from '../utils/enterprise-trial-features';

import { EnterpriseTrialLockedActions } from './enterprise-trial-locked-actions';
import { PlanBadge } from './plan-badge';
import { FeatureKey } from './request-trial';

export function EnterpriseLockedCard({
  featureKey,
  fallbackHeadline,
  fallbackDescription,
  fallbackBenefits,
  showBenefits = false,
  surface,
  className,
}: EnterpriseLockedCardProps) {
  const copy = enterpriseTrialFeatures.lockedCopy(featureKey);
  const headline =
    copy?.headline ??
    fallbackHeadline ??
    enterpriseTrialFeatures.name(featureKey);
  const description = copy?.description ?? fallbackDescription;
  const benefits = showBenefits ? copy?.benefits ?? fallbackBenefits ?? [] : [];

  return (
    <Card
      role="status"
      data-slot="enterprise-locked-card"
      className={cn(
        'flex shrink-0 flex-col gap-5 p-6',
        enterpriseMotion.appear,
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-2">
        <PlanBadge featureKey={featureKey} />
        {headline && (
          <h2 className="pt-1 text-lg font-semibold tracking-tight text-gray-12">
            {headline}
          </h2>
        )}
        {description && (
          <p className="max-w-2xl text-sm text-pretty text-gray-11">
            {description}
          </p>
        )}
        {benefits.length > 0 && (
          <ul className="flex flex-col gap-1.5 pt-2">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-2 text-sm text-gray-12"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-success-11" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <EnterpriseTrialLockedActions featureKey={featureKey} surface={surface} />
    </Card>
  );
}

type EnterpriseLockedCardProps = {
  featureKey: FeatureKey;
  fallbackHeadline?: string;
  fallbackDescription?: string;
  fallbackBenefits?: string[];
  showBenefits?: boolean;
  surface: PlatformAdminSurface;
  className?: string;
};
