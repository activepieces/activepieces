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
  | 'chevron';

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

type AgentMarkProps = {
  icon: AgentIcon;
  color: ColorName;
  size?: keyof typeof SIZES;
};

export const AgentMark = ({
  icon,
  color,
  size = 'default',
}: AgentMarkProps) => {
  const shape = SHAPE_BY_ICON[icon];
  const eyes = EYES_BY_SHAPE[shape] ?? { cy: 24, dx: 5 };
  const fill = PROJECT_COLOR_PALETTE[color].color;
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center border border-[#E7E7EA] bg-background',
        SIZES[size].box,
      )}
    >
      <svg
        width={SIZES[size].canvas}
        height={SIZES[size].canvas}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden
      >
        <path d={SHAPE_PATHS[shape]} fill={fill} />
        <circle cx={24 - eyes.dx} cy={eyes.cy} r="3.9" fill="#FFFFFF" />
        <circle cx={24 + eyes.dx} cy={eyes.cy} r="3.9" fill="#FFFFFF" />
      </svg>
    </div>
  );
};
