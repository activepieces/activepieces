import { LockKeyhole } from 'lucide-react';
import { ComponentType, SVGProps } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Dot } from '@/components/ui/dot';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import { cn } from '@/lib/utils';

export type SidebarItemType = {
  to: string;
  label: string;
  type: 'link';
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  notification?: boolean;
  locked?: boolean;
  newWindow?: boolean;
  isActive?: (pathname: string) => boolean;
  isSubItem?: boolean;
  show?: boolean;
  hasPermission?: boolean;
  onClick?: () => void;
};

export const ApSidebarItem = (item: SidebarItemType) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isLinkActive =
    location.pathname.startsWith(item.to) || item.isActive?.(location.pathname);
  const isCollapsed = state === 'collapsed';

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className={cn(
          { 'bg-sidebar-accent hover:bg-sidebar-accent!': isLinkActive },
          '',
        )}
        onClick={() => navigate(item.to)}
      >
        {item.icon && <item.icon className="size-4" />}
        {!isCollapsed && <span className="text-sm">{item.label}</span>}
        {!isCollapsed && item.locked && (
          <LockKeyhole className="size-3.5! ml-auto" />
        )}
        {item.notification && !item.locked && (
          <Dot
            variant="destructive"
            className="absolute right-1 top-2 transform -translate-y-1/2 size-2 rounded-full"
          />
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};
