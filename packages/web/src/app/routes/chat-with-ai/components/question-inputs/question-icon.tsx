import {
  BarChart3,
  Bell,
  Bookmark,
  Bot,
  Briefcase,
  Building2,
  Calendar,
  CalendarClock,
  Check,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Circle,
  CircleX,
  Clock,
  Cloud,
  CreditCard,
  Database,
  DollarSign,
  Download,
  Eye,
  File,
  FileText,
  Filter,
  Flag,
  Folder,
  Gift,
  Globe,
  Hash,
  Heart,
  Home,
  Image,
  Key,
  LineChart,
  Link,
  type LucideIcon,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Mic,
  Minus,
  Moon,
  Package,
  Palette,
  Pause,
  Pencil,
  Phone,
  PieChart,
  Play,
  Plus,
  RefreshCw,
  Repeat,
  Rocket,
  Search,
  Send,
  Server,
  Settings,
  Shield,
  SlidersHorizontal,
  Smartphone,
  Smile,
  Sparkles,
  Square,
  Star,
  Sun,
  Table,
  Tag,
  Tags,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  TrendingUp,
  TriangleAlert,
  Truck,
  Upload,
  User,
  UserPlus,
  Users,
  Video,
  Wifi,
  X,
  Zap,
} from 'lucide-react';

import { MultiQuestion } from '@/features/chat/lib/chat-store-types';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { cn } from '@/lib/utils';

import { normalizePieceName } from '../../lib/message-parsers';

const ICON_MAP: Record<string, LucideIcon> = {
  mail: Mail,
  'message-square': MessageSquare,
  'message-circle': MessageCircle,
  send: Send,
  bell: Bell,
  calendar: Calendar,
  'calendar-clock': CalendarClock,
  clock: Clock,
  zap: Zap,
  database: Database,
  table: Table,
  'file-text': FileText,
  file: File,
  folder: Folder,
  globe: Globe,
  link: Link,
  hash: Hash,
  phone: Phone,
  smartphone: Smartphone,
  user: User,
  users: Users,
  'user-plus': UserPlus,
  tag: Tag,
  tags: Tags,
  filter: Filter,
  search: Search,
  check: Check,
  'check-circle': CircleCheck,
  x: X,
  'x-circle': CircleX,
  circle: Circle,
  'alert-triangle': TriangleAlert,
  'alert-circle': CircleAlert,
  info: CircleAlert,
  star: Star,
  heart: Heart,
  flag: Flag,
  bookmark: Bookmark,
  repeat: Repeat,
  'refresh-cw': RefreshCw,
  play: Play,
  pause: Pause,
  square: Square,
  settings: Settings,
  'sliders-horizontal': SlidersHorizontal,
  plus: Plus,
  minus: Minus,
  'trash-2': Trash2,
  pencil: Pencil,
  download: Download,
  upload: Upload,
  cloud: Cloud,
  server: Server,
  lock: Lock,
  key: Key,
  shield: Shield,
  eye: Eye,
  'dollar-sign': DollarSign,
  'credit-card': CreditCard,
  'bar-chart': BarChart3,
  'line-chart': LineChart,
  'pie-chart': PieChart,
  'trending-up': TrendingUp,
  image: Image,
  video: Video,
  mic: Mic,
  'map-pin': MapPin,
  truck: Truck,
  package: Package,
  gift: Gift,
  briefcase: Briefcase,
  building: Building2,
  home: Home,
  bot: Bot,
  sparkles: Sparkles,
  rocket: Rocket,
  'thumbs-up': ThumbsUp,
  'thumbs-down': ThumbsDown,
  smile: Smile,
  sun: Sun,
  moon: Moon,
  wifi: Wifi,
};

function DynamicLucideIcon({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  const Icon = (name && ICON_MAP[name]) || Circle;
  return <Icon className={cn('size-4', className)} aria-hidden />;
}

export function OptionIcon({
  piece,
  icon,
  label,
  variant,
}: {
  piece?: string;
  icon?: string;
  label?: string;
  variant: 'list' | 'plain';
}) {
  if (variant === 'plain') {
    return <PlainOptionIcon piece={piece} icon={icon} label={label} />;
  }
  if (piece) {
    return (
      <PieceIconWithPieceName
        pieceName={normalizePieceName(piece)}
        size="sm"
        border={false}
        showTooltip={false}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-md bg-gray-5 text-gray-11"
    >
      <DynamicLucideIcon name={icon} className="size-4" />
    </span>
  );
}

function PlainOptionIcon({
  piece,
  icon,
  label,
}: {
  piece?: string;
  icon?: string;
  label?: string;
}) {
  if (piece) {
    return (
      <PieceIconWithPieceName
        pieceName={normalizePieceName(piece)}
        size="xs"
        border={false}
        showTooltip={false}
      />
    );
  }
  if (icon) {
    return <DynamicLucideIcon name={icon} className="size-5 text-gray-11" />;
  }
  return (
    <span
      aria-hidden
      className="flex size-5 shrink-0 items-center justify-center rounded bg-gray-4 text-xs font-medium text-gray-11"
    >
      {label?.trim().charAt(0).toUpperCase()}
    </span>
  );
}

export const QUESTION_TYPE_ICON: Record<MultiQuestion['type'], LucideIcon> = {
  choice: CircleHelp,
  multi_choice: CircleHelp,
  date: Calendar,
  date_range: Calendar,
  time: Clock,
  slider: SlidersHorizontal,
  color: Palette,
};
