import {
  Add01Icon,
  AiMagicIcon,
  Alert02Icon,
  AlertCircleIcon,
  AnalyticsUpIcon,
  BarChartIcon,
  Bookmark02Icon,
  Briefcase01Icon,
  BubbleChatIcon,
  Building03Icon,
  Calendar03Icon,
  CalendarClockIcon,
  Call02Icon,
  Cancel01Icon,
  CancelCircleIcon,
  ChartLineData02Icon,
  CheckmarkCircle02Icon,
  CircleIcon,
  Clock01Icon,
  CloudIcon,
  CreditCardIcon,
  DatabaseIcon,
  Delete02Icon,
  Dollar01Icon,
  Download04Icon,
  FavouriteIcon,
  File01Icon,
  File02Icon,
  FilterIcon,
  Flag01Icon,
  FlashIcon,
  Folder01Icon,
  GiftIcon,
  Globe02Icon,
  HashIcon,
  Home03Icon,
  Image01Icon,
  Key01Icon,
  Link02Icon,
  Location01Icon,
  LockKeyholeIcon,
  Mail01Icon,
  Mic01Icon,
  Moon02Icon,
  Notification01Icon,
  PackageIcon,
  PauseIcon,
  PencilEdit01Icon,
  PieChart01Icon,
  PlayIcon,
  PreferenceHorizontalIcon,
  RefreshIcon,
  Remove01Icon,
  RepeatIcon,
  Robot01Icon,
  Rocket01Icon,
  Search01Icon,
  SentIcon,
  ServerStack01Icon,
  Settings01Icon,
  Shield01Icon,
  SmartPhone01Icon,
  SmileIcon,
  StarIcon,
  StopIcon,
  Sun03Icon,
  TableIcon,
  Tag01Icon,
  TagsIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  Tick02Icon,
  TruckIcon,
  Upload01Icon,
  UserAdd01Icon,
  UserIcon,
  UserMultipleIcon,
  Video01Icon,
  ViewIcon,
  Wifi01Icon,
} from '@hugeicons/core-free-icons';

import {
  HugeiconsIcon,
  type IconSvgElement,
} from '@/components/custom/hugeicons-icon';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { cn } from '@/lib/utils';

import { normalizePieceName } from '../../lib/message-parsers';

const ICON_MAP: Record<string, IconSvgElement> = {
  mail: Mail01Icon,
  'message-square': BubbleChatIcon,
  'message-circle': BubbleChatIcon,
  send: SentIcon,
  bell: Notification01Icon,
  calendar: Calendar03Icon,
  'calendar-clock': CalendarClockIcon,
  clock: Clock01Icon,
  zap: FlashIcon,
  database: DatabaseIcon,
  table: TableIcon,
  'file-text': File02Icon,
  file: File01Icon,
  folder: Folder01Icon,
  globe: Globe02Icon,
  link: Link02Icon,
  hash: HashIcon,
  phone: Call02Icon,
  smartphone: SmartPhone01Icon,
  user: UserIcon,
  users: UserMultipleIcon,
  'user-plus': UserAdd01Icon,
  tag: Tag01Icon,
  tags: TagsIcon,
  filter: FilterIcon,
  search: Search01Icon,
  check: Tick02Icon,
  'check-circle': CheckmarkCircle02Icon,
  x: Cancel01Icon,
  'x-circle': CancelCircleIcon,
  circle: CircleIcon,
  'alert-triangle': Alert02Icon,
  'alert-circle': AlertCircleIcon,
  info: AlertCircleIcon,
  star: StarIcon,
  heart: FavouriteIcon,
  flag: Flag01Icon,
  bookmark: Bookmark02Icon,
  repeat: RepeatIcon,
  'refresh-cw': RefreshIcon,
  play: PlayIcon,
  pause: PauseIcon,
  square: StopIcon,
  settings: Settings01Icon,
  'sliders-horizontal': PreferenceHorizontalIcon,
  plus: Add01Icon,
  minus: Remove01Icon,
  'trash-2': Delete02Icon,
  pencil: PencilEdit01Icon,
  download: Download04Icon,
  upload: Upload01Icon,
  cloud: CloudIcon,
  server: ServerStack01Icon,
  lock: LockKeyholeIcon,
  key: Key01Icon,
  shield: Shield01Icon,
  eye: ViewIcon,
  'dollar-sign': Dollar01Icon,
  'credit-card': CreditCardIcon,
  'bar-chart': BarChartIcon,
  'line-chart': ChartLineData02Icon,
  'pie-chart': PieChart01Icon,
  'trending-up': AnalyticsUpIcon,
  image: Image01Icon,
  video: Video01Icon,
  mic: Mic01Icon,
  'map-pin': Location01Icon,
  truck: TruckIcon,
  package: PackageIcon,
  gift: GiftIcon,
  briefcase: Briefcase01Icon,
  building: Building03Icon,
  home: Home03Icon,
  bot: Robot01Icon,
  sparkles: AiMagicIcon,
  rocket: Rocket01Icon,
  'thumbs-up': ThumbsUpIcon,
  'thumbs-down': ThumbsDownIcon,
  smile: SmileIcon,
  sun: Sun03Icon,
  moon: Moon02Icon,
  wifi: Wifi01Icon,
};

export function DynamicIcon({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  const Icon = (name && ICON_MAP[name]) || CircleIcon;
  return (
    <HugeiconsIcon
      icon={Icon}
      className={cn('size-4', className)}
      aria-hidden
    />
  );
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
        'flex shrink-0 items-center justify-center bg-gray-5 text-gray-11 transition-colors',
        variant === 'grid' ? 'size-10 rounded-lg' : 'size-8 rounded-md',
        selected &&
          (variant === 'grid'
            ? 'bg-accent-5 text-accent-11'
            : 'bg-gray-12 text-gray-1'),
      )}
    >
      <DynamicIcon
        name={icon}
        className={variant === 'grid' ? 'size-5' : 'size-4'}
      />
    </span>
  );
}
