import { Badge } from '@/components/ui/badge';
import { PROJECT_COLOR_PALETTE, ColorName } from '@activepieces/shared';

type TagWithBrightProps = {
  prefix?: string;
  title: string;
  color: string;
  icon?: string;
  size?: 'sm' | 'md';
};

export const TagWithBright = ({ 
  prefix,
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
          backgroundColor: '#e4fded',
          color: '#000000',
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
        {prefix && (
          <span className="relative z-10 font-medium mr-1">{prefix}</span>
        )}
        <span className="relative z-10 font-bold">{title}</span>
      </Badge>
    </>
  );
};
