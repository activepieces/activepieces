import { ComponentType, SVGProps } from 'react';

export type SidebarGroupType = {
  name?: string;
  label: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  items: SidebarItemType[];
  type: 'group';
  open: boolean;
  setOpen: (open: boolean) => void;
  isActive?: (pathname: string) => boolean;
};

export type SidebarItemType = {
  to: string;
  label: string;
  type: 'link';
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  notification?: boolean;
  locked?: boolean;
  newWindow?: boolean;
  isActive?: (pathname: string) => boolean;
  isBeta?: boolean;
  isSubItem?: boolean;
  show?: boolean;
  hasPermission?: boolean;
};

export type SidebarGeneralItemType = SidebarItemType | SidebarGroupType;
