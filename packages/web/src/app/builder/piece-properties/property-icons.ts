import {
  Attachment01Icon,
  Calendar03Icon,
  Delete02Icon,
  File02Icon,
  FilterIcon,
  HashIcon,
  InboxIcon,
  Location01Icon,
  PreferenceHorizontalIcon,
  ReplyAllIcon,
  ReplyIcon,
  SentIcon,
  SourceCodeSquareIcon,
  SquareDashedIcon,
  Tag01Icon,
  TextAlignLeftIcon,
  TextIcon,
  UserIcon,
  UserMultipleIcon,
} from '@hugeicons/core-free-icons';

import { type IconSvgElement } from '@/components/custom/hugeicons-icon';

function getPropertyIcon(name: string | undefined): IconSvgElement | undefined {
  return name ? ICON_MAP[name] : undefined;
}

const ICON_MAP: Record<string, IconSvgElement> = {
  text: TextAlignLeftIcon,
  code: SourceCodeSquareIcon,
  markdown: HashIcon,
  reply: ReplyIcon,
  'reply-all': ReplyAllIcon,
  users: UserMultipleIcon,
  user: UserIcon,
  send: SentIcon,
  type: TextIcon,
  file: File02Icon,
  paperclip: Attachment01Icon,
  location: Location01Icon,
  tag: Tag01Icon,
  inbox: InboxIcon,
  calendar: Calendar03Icon,
  trash: Delete02Icon,
  filter: FilterIcon,
  sliders: PreferenceHorizontalIcon,
  blank: SquareDashedIcon,
};

export const propertyIcons = { get: getPropertyIcon };
