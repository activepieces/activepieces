import { LineChart, Clock } from 'lucide-react';

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
  size = 'sm',
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
        className={`border-0 h-fit relative overflow-hidden ${
          size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm'
        }`}
        style={{
          backgroundColor: color,
          color: '#000000',
        }}
      >
        <span
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 50%, transparent 100%)`,
            animation: 'shine 2.5s ease-out infinite',
            width: '100%',
            transform: 'translateX(-100%)',
          }}
        />
        {index === 0 && (
          <LineChart className="relative font-medium mr-1.5 w-3.5 h-3.5" />
        )}
        {index === 1 && (
          <Clock className="relative font-medium mr-1.5 w-3.5 h-3.5" />
        )}
        {prefix && <span className="relative font-medium mr-1">{prefix}</span>}
        <span className="relative font-bold">{title}</span>
      </Badge>
    </>
  );
};
