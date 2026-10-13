import { Gem } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { usePlanTier } from '../hooks/use-plan-tier';

import { FeatureKey } from './request-trial';

export function PlanBadge({ featureKey, className }: PlanBadgeProps) {
  const plan = usePlanTier(featureKey);
  return (
    <Badge
      variant="info"
      data-slot="plan-badge"
      className={cn('shrink-0', className)}
    >
      <Gem />
      {plan.badge}
    </Badge>
  );
}

type PlanBadgeProps = {
  featureKey: FeatureKey | undefined;
  className?: string;
};
