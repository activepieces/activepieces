import { PlatformAdminSurface } from '@activepieces/shared';
import { Check } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { enterpriseMotion } from '../utils/enterprise-motion';
import {
  enterpriseTrialFeatures,
  LockedFeatureCopy,
} from '../utils/enterprise-trial-features';

import { EnterpriseTrialLockedActions } from './enterprise-trial-locked-actions';
import { PlanBadge } from './plan-badge';
import { FeatureKey } from './request-trial';

export function EnterpriseLockedCard({
  featureKey,
  copyOverride,
  fallbackHeadline,
  fallbackDescription,
  fallbackBenefits,
  showBenefits = false,
  showContactSales = true,
  surface,
  className,
}: EnterpriseLockedCardProps) {
  const copy = copyOverride ?? enterpriseTrialFeatures.lockedCopy(featureKey);
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
        '@container shrink-0 p-5',
        enterpriseMotion.appear,
        className,
      )}
    >
      <div className="flex flex-col gap-4 @3xl:flex-row @3xl:items-center @3xl:gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {headline && (
              <h2 className="text-base font-semibold tracking-tight text-pretty text-gray-12">
                {headline}
              </h2>
            )}
            <PlanBadge featureKey={featureKey} />
          </div>
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
        <div className="shrink-0">
          <EnterpriseTrialLockedActions
            featureKey={featureKey}
            surface={surface}
            primaryLast
            finePrintBelow
            showContactSales={showContactSales}
          />
        </div>
      </div>
    </Card>
  );
}

type EnterpriseLockedCardProps = {
  featureKey: FeatureKey;
  copyOverride?: LockedFeatureCopy;
  fallbackHeadline?: string;
  fallbackDescription?: string;
  fallbackBenefits?: string[];
  showBenefits?: boolean;
  showContactSales?: boolean;
  surface: PlatformAdminSurface;
  className?: string;
};
