import { Badge } from '@/components/ui/badge';
import { PROJECT_COLOR_PALETTE, ColorName } from '@activepieces/shared';

type TagWithBrightProps = {
  title: string;
  color: ColorName;
  icon?: string;
  size?: 'sm' | 'md';
};

export const TagWithBright = ({ 
  title, 
  color, 
  size = 'sm' 
}: TagWithBrightProps) => {
  return (
    <>
      <style>{`
        @keyframes shine {
          0%, 80% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
      <Badge
        variant="outline"
        className={`border-0 h-fit relative overflow-hidden ${
          size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm'
        }`}
        style={{
          backgroundColor: PROJECT_COLOR_PALETTE[color].color,
          color: PROJECT_COLOR_PALETTE[color].textColor,
        }}
      >
        <span
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)`,
            animation: 'shine 5s ease-out infinite',
            width: '100%',
            transform: 'translateX(-100%)',
          }}
        />
        <span className="relative z-10">{title}</span>
      </Badge>
    </>
  );
};
