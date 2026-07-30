import {
  AlignLeft,
  Calendar,
  Code2,
  FileText,
  Filter,
  Hash,
  Inbox,
  LucideIcon,
  Paperclip,
  Reply,
  ReplyAll,
  Send,
  SlidersHorizontal,
  SquareDashed,
  Tag,
  Trash2,
  Type,
  User,
  Users,
} from 'lucide-react';

function getPropertyIcon(name: string | undefined): LucideIcon | undefined {
  return name ? ICON_MAP[name] : undefined;
}

const ICON_MAP: Record<string, LucideIcon> = {
  text: AlignLeft,
  code: Code2,
  markdown: Hash,
  reply: Reply,
  'reply-all': ReplyAll,
  users: Users,
  user: User,
  send: Send,
  type: Type,
  file: FileText,
  paperclip: Paperclip,
  tag: Tag,
  inbox: Inbox,
  calendar: Calendar,
  trash: Trash2,
  filter: Filter,
  sliders: SlidersHorizontal,
  blank: SquareDashed,
};

export const propertyIcons = { get: getPropertyIcon };
