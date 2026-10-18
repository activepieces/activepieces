import { PlatformAdminSurface } from '@activepieces/shared';

import { cn } from '@/lib/utils';

import { useEnterpriseGate } from '../hooks/use-enterprise-gate';
import { enterpriseMotion } from '../utils/enterprise-motion';

import { EnterpriseTrialLockedActions } from './enterprise-trial-locked-actions';
import { PlanBadge } from './plan-badge';
import { FeatureKey } from './request-trial';

export function EnterpriseLockedRow({
  unlocked,
  featureKey,
  line,
}: EnterpriseLockedRowProps) {
  const gate = useEnterpriseGate({ unlocked, featureKey });
  if (!gate.locked) {
    return null;
  }
  return (
    <div
      role="status"
      data-slot="enterprise-locked-row"
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-lg border bg-gray-1 px-4 py-3',
        enterpriseMotion.appear,
      )}
    >
      <div className="flex min-w-0 flex-1 basis-64 items-center gap-2.5">
        <PlanBadge featureKey={featureKey} />
        <p className="min-w-0 text-sm text-gray-12">{line}</p>
      </div>
      <EnterpriseTrialLockedActions
        featureKey={featureKey}
        surface={PlatformAdminSurface.TEASER}
        compact
      />
    </div>
  );
}

type EnterpriseLockedRowProps = {
  unlocked: boolean;
  featureKey: FeatureKey;
  line: string;
};
