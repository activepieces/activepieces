import { t } from 'i18next';
import { Crown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

import { FeatureTier, TIER_LABELS } from '../utils/feature-tier';

export function PlanBadge({
  tier,
  variant = 'outline',
  className,
}: PlanBadgeProps) {
  return (
    <Badge variant={variant} className={className}>
      <Crown aria-hidden />
      {t('{tier} plan', { tier: TIER_LABELS[tier] })}
    </Badge>
  );
}

type PlanBadgeProps = {
  tier: FeatureTier;
  variant?: 'outline' | 'secondary';
  className?: string;
};
