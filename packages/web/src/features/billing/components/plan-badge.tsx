import { CrownIcon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Badge } from '@/components/ui/badge';

import { FeatureTier, TIER_LABELS } from '../utils/feature-tier';

export function PlanBadge({
  tier,
  variant = 'outline',
  className,
}: PlanBadgeProps) {
  return (
    <Badge variant={variant} className={className}>
      <HugeiconsIcon icon={CrownIcon} aria-hidden />
      {t('{tier} plan', { tier: TIER_LABELS[tier] })}
    </Badge>
  );
}

type PlanBadgeProps = {
  tier: FeatureTier;
  variant?: 'outline' | 'secondary' | 'info';
  className?: string;
};
