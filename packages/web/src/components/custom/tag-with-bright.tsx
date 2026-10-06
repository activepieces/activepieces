import { brandColors } from '@activepieces/shared';
import { ChartLineData02Icon, Clock01Icon } from '@hugeicons/core-free-icons';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Badge } from '@/components/ui/badge';

type TagWithBrightProps = {
  index?: number;
  prefix?: string;
  title: string;
  color: string;
  icon?: string;
  size?: 'sm' | 'md';
};

export const TagWithBright = ({
  index,
  prefix,
  title,
  color,
}: TagWithBrightProps) => {
  return (
    <>
      <style>{`
        @keyframes shine {
          0%, 70% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
      <Badge
        variant="outline"
        className="relative overflow-hidden border-0"
        style={{
          backgroundColor: color,
          color: brandColors.onPrimaryFor({ hex: color }),
        }}
      >
        <span
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)`,
            animation: 'shine 2.5s ease-out infinite',
            width: '100%',
            transform: 'translateX(-100%)',
          }}
        />
        {index === 0 && (
          <HugeiconsIcon icon={ChartLineData02Icon} className="relative" />
        )}
        {index === 1 && (
          <HugeiconsIcon icon={Clock01Icon} className="relative" />
        )}
        {prefix && <span className="relative font-medium">{prefix}</span>}
        <span className="relative font-semibold">{title}</span>
      </Badge>
    </>
  );
};
