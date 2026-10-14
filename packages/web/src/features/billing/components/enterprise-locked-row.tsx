import { PlatformAdminSurface } from '@activepieces/shared';

import { cn } from '@/lib/utils';

import { enterpriseMotion } from '../utils/enterprise-motion';

import { EnterpriseTrialLockedActions } from './enterprise-trial-locked-actions';
import { PlanBadge } from './plan-badge';
import { FeatureKey } from './request-trial';

export function EnterpriseLockedRow({
  featureKey,
  line,
  surface,
  className,
}: EnterpriseLockedRowProps) {
  return (
    <div
      role="status"
      data-slot="enterprise-locked-row"
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-lg border bg-gray-1 px-4 py-3',
        enterpriseMotion.appear,
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 basis-64 items-center gap-2.5">
        <PlanBadge featureKey={featureKey} />
        <p className="min-w-0 text-sm text-gray-12">{line}</p>
      </div>
      <EnterpriseTrialLockedActions
        featureKey={featureKey}
        surface={surface}
        compact
        primaryLast
      />
    </div>
  );
}

type EnterpriseLockedRowProps = {
  featureKey: FeatureKey;
  line: string;
  surface: PlatformAdminSurface;
  className?: string;
};
