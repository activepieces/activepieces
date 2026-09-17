import {
  AgentIcon,
  ColorName,
  PROJECT_COLOR_PALETTE,
} from '@activepieces/shared';

import { cn } from '@/lib/utils';

type MarkShape =
  | 'triangle'
  | 'squircle'
  | 'pentagon'
  | 'circle'
  | 'diamond'
  | 'hexagon'
  | 'capsule'
  | 'shield'
  | 'chevron'
  | 'roundedSquare';

const SHAPE_PATHS: Record<MarkShape, string> = {
  triangle: 'M24 7 L40.5 36 Q42.5 39.5 38.5 39.5 L9.5 39.5 Q5.5 39.5 7.5 36 Z',
  squircle: 'M24 6 Q42 6 42 24 Q42 42 24 42 Q6 42 6 24 Q6 6 24 6 Z',
  pentagon: 'M24 6 L41 18.5 L34.5 39 H13.5 L7 18.5 Z',
  circle: 'M24 6 A18 18 0 1 1 23.9 6 Z',
  diamond: 'M24 5 L43 24 L24 43 L5 24 Z',
  hexagon: 'M24 5 L40 14.5 V33.5 L24 43 L8 33.5 V14.5 Z',
  capsule: 'M15 9 H33 Q43 9 43 24 Q43 39 33 39 H15 Q5 39 5 24 Q5 9 15 9 Z',
  shield: 'M24 5 L42 12 V26 Q42 38 24 43 Q6 38 6 26 V12 Z',
  chevron: 'M6 10 H42 L24 42 Z',
  roundedSquare:
    'M16 4 H32 Q44 4 44 16 V32 Q44 44 32 44 H16 Q4 44 4 32 V16 Q4 4 16 4 Z',
};

const SHAPE_BY_ICON: Record<AgentIcon, MarkShape> = {
  [AgentIcon.BOT]: 'squircle',
  [AgentIcon.SPARKLES]: 'triangle',
  [AgentIcon.MESSAGE]: 'capsule',
  [AgentIcon.USERS]: 'pentagon',
  [AgentIcon.BOOK]: 'shield',
  [AgentIcon.CHART]: 'hexagon',
  [AgentIcon.CALENDAR]: 'squircle',
  [AgentIcon.MAIL]: 'capsule',
  [AgentIcon.GLOBE]: 'circle',
  [AgentIcon.FILE]: 'shield',
  [AgentIcon.SEARCH]: 'circle',
  [AgentIcon.ZAP]: 'diamond',
};

const EYES_BY_SHAPE: Partial<Record<MarkShape, { cy: number; dx: number }>> = {
  triangle: { cy: 31, dx: 5 },
  chevron: { cy: 22, dx: 5 },
  pentagon: { cy: 25, dx: 5 },
};

const SIZES = {
  sm: { box: 'size-8 rounded-lg', canvas: 32 },
  default: { box: 'size-12 rounded-[14px]', canvas: 48 },
  welcome: { box: 'size-[60px] rounded-[14px]', canvas: 44 },
} as const;

const TRIO: TrioGlyph[] = [
  {
    shape: 'circle',
    fill: '#0D9488',
    size: 72,
    left: 20,
    top: 24,
    rotate: -8,
    shadow: '0 4px 9px rgba(13, 148, 136, 0.3)',
  },
  {
    shape: 'hexagon',
    fill: '#D97706',
    size: 74,
    left: 146,
    top: 22,
    rotate: 8,
    shadow: '0 4px 9px rgba(217, 119, 6, 0.3)',
  },
  {
    shape: 'roundedSquare',
    fill: 'hsl(var(--primary))',
    size: 84,
    left: 76,
    top: 6,
    rotate: 0,
    shadow: '0 5px 11px hsl(var(--primary) / 0.36)',
  },
];

type TrioGlyph = {
  shape: MarkShape;
  fill: string;
  size: number;
  left: number;
  top: number;
  rotate: number;
  shadow: string;
};

type AgentGlyphProps = {
  shape: MarkShape;
  fill: string;
  size: number;
};

type AgentMarkProps = {
  icon: AgentIcon;
  color: ColorName;
  size?: keyof typeof SIZES;
};

const AgentGlyph = ({ shape, fill, size }: AgentGlyphProps) => {
  const eyes = EYES_BY_SHAPE[shape] ?? { cy: 24, dx: 5 };
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d={SHAPE_PATHS[shape]} fill={fill} />
      <circle cx={24 - eyes.dx} cy={eyes.cy} r="3.9" fill="#FFFFFF" />
      <circle cx={24 + eyes.dx} cy={eyes.cy} r="3.9" fill="#FFFFFF" />
    </svg>
  );
};

export const AgentMark = ({
  icon,
  color,
  size = 'default',
}: AgentMarkProps) => (
  <div
    className={cn(
      'flex shrink-0 items-center justify-center border border-[#E7E7EA] bg-background',
      SIZES[size].box,
    )}
  >
    <AgentGlyph
      shape={SHAPE_BY_ICON[icon]}
      fill={PROJECT_COLOR_PALETTE[color].color}
      size={SIZES[size].canvas}
    />
  </div>
);

export const AgentTrioMark = ({ className }: { className?: string }) => (
  <div className={cn('relative h-[104px] w-[236px] shrink-0', className)}>
    {TRIO.map((glyph) => (
      <div
        key={glyph.shape}
        className="absolute origin-top-left"
        style={{
          left: glyph.left,
          top: glyph.top,
          rotate: `${glyph.rotate}deg`,
          filter: `drop-shadow(${glyph.shadow})`,
        }}
      >
        <AgentGlyph shape={glyph.shape} fill={glyph.fill} size={glyph.size} />
      </div>
    ))}
  </div>
);
