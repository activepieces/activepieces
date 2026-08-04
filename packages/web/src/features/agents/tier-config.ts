import { AiRoutingTierId } from '@activepieces/shared';
import { Equal, Lightbulb, Rocket } from 'lucide-react';

export const TIER_CONFIG: Record<
  AiRoutingTierId,
  {
    icon: React.ComponentType<{ className?: string }>;
    displayLabel: string;
    description: string;
  }
> = {
  fast: {
    icon: Equal,
    displayLabel: 'Fast',
    description: 'Quick replies for simple tasks',
  },
  smart: {
    icon: Lightbulb,
    displayLabel: 'Expert',
    description: 'Best for everyday use',
  },
  premium: {
    icon: Rocket,
    displayLabel: 'Heavy',
    description: 'Highest quality, a bit slower',
  },
};
