import { Gem } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

import { usePlanTier } from '../hooks/use-plan-tier';

import { FeatureKey } from './request-trial';

export function PlanBadge({
  featureKey,
}: {
  featureKey: FeatureKey | undefined;
}) {
  const plan = usePlanTier(featureKey);
  return (
    <Badge variant="info" data-slot="plan-badge" className="shrink-0">
      <Gem />
      {plan.badge}
    </Badge>
  );
}
