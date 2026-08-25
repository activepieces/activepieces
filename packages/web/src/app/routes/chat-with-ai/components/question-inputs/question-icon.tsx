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

export function DynamicLucideIcon({
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
  selected,
  variant,
}: {
  piece?: string;
  icon?: string;
  selected?: boolean;
  variant: 'grid' | 'list';
}) {
  if (piece) {
    return (
      <PieceIconWithPieceName
        pieceName={normalizePieceName(piece)}
        size={variant === 'grid' ? 'lg' : 'sm'}
        border={false}
        showTooltip={false}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center bg-muted-foreground/10 text-muted-foreground transition-colors',
        variant === 'grid' ? 'size-10 rounded-lg' : 'size-8 rounded-md',
        selected &&
          (variant === 'grid'
            ? 'bg-primary/15 text-primary'
            : 'bg-foreground text-background'),
      )}
    >
      <DynamicLucideIcon
        name={icon}
        className={variant === 'grid' ? 'size-5' : 'size-4'}
      />
    </span>
  );
}

export const ALLOWED_QUESTION_ICONS = Object.keys(ICON_MAP);
