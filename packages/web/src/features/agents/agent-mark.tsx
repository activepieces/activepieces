import {
  AgentIcon,
  ColorName,
  PROJECT_COLOR_PALETTE,
} from '@activepieces/shared';
import {
  BookOpen,
  Bot,
  Calendar,
  ChartLine,
  FileText,
  Globe,
  LucideIcon,
  Mail,
  MessageSquare,
  Search,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const GLYPHS: Record<AgentIcon, LucideIcon> = {
  [AgentIcon.BOT]: Bot,
  [AgentIcon.SPARKLES]: Sparkles,
  [AgentIcon.MESSAGE]: MessageSquare,
  [AgentIcon.USERS]: Users,
  [AgentIcon.BOOK]: BookOpen,
  [AgentIcon.CHART]: ChartLine,
  [AgentIcon.CALENDAR]: Calendar,
  [AgentIcon.MAIL]: Mail,
  [AgentIcon.GLOBE]: Globe,
  [AgentIcon.FILE]: FileText,
  [AgentIcon.SEARCH]: Search,
  [AgentIcon.ZAP]: Zap,
};

const SIZES = {
  sm: { box: 'size-8 rounded-lg', glyph: 16 },
  default: { box: 'size-12 rounded-[14px]', glyph: 24 },
} as const;

type AgentMarkProps = {
  icon: AgentIcon;
  color: ColorName;
  size?: keyof typeof SIZES;
  className?: string;
};

export const AgentMark = ({
  icon,
  color,
  size = 'default',
  className,
}: AgentMarkProps) => {
  const Glyph = GLYPHS[icon];
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center border border-[#E7E7EA] bg-background',
        SIZES[size].box,
        className,
      )}
      style={{ color: PROJECT_COLOR_PALETTE[color].color }}
    >
      <Glyph size={SIZES[size].glyph} strokeWidth={2} />
    </div>
  );
};
