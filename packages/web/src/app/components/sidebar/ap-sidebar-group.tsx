import { ComponentType } from 'react';

import { SidebarItemType } from './ap-sidebar-item';

export type SidebarGeneralItemType = SidebarItemType | SidebarGroupType;

export type SidebarGroupType = {
  name?: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  items: SidebarItemType[];
  type: 'group';
  open: boolean;
  setOpen: (open: boolean) => void;
  isActive?: (pathname: string) => boolean;
};
