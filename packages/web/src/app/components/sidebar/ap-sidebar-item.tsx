import { LockKeyhole } from 'lucide-react';
import React, { ComponentType, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Dot } from '@/components/custom/dot';
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
  icon?: ComponentType<{ className?: string }>;
  notification?: boolean;
  locked?: boolean;
  newWindow?: boolean;
  isActive?: (pathname: string) => boolean;
  isSubItem?: boolean;
  show?: boolean;
  hasPermission?: boolean;
  onClick?: () => void;
  badge?: string;
  iconClassName?: string;
  highlight?: boolean;
};

export const ApSidebarItem = (item: SidebarItemType) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const iconRef = useRef<AnimatedIconHandle | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isLinkActive =
    location.pathname.startsWith(item.to) || item.isActive?.(location.pathname);
  const isCollapsed = state === 'collapsed';

  useEffect(() => {
    if (isHovered) {
      iconRef.current?.startAnimation?.();
    } else {
      iconRef.current?.stopAnimation?.();
    }
  }, [isHovered]);

  const button = (
    <SidebarMenuButton
      className={cn(
        { 'bg-sidebar-accent hover:bg-sidebar-accent!': isLinkActive },
        item.highlight && 'relative bg-background hover:bg-background/80',
      )}
      onClick={() => {
        item.onClick?.();
        navigate(item.to);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {item.icon && renderIcon(item.icon, iconRef, item.iconClassName)}
      {!isCollapsed && (
        <span className={cn('text-sm', { 'font-semibold': isLinkActive })}>
          {item.label}
        </span>
      )}
      {!isCollapsed && item.badge && (
        <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
          {item.badge}
        </span>
      )}
      {!isCollapsed && item.locked && !item.badge && (
        <LockKeyhole className="size-3.5! ml-auto" />
      )}
      {item.notification && !item.locked && (
        <Dot
          variant="destructive"
          className="absolute right-1 top-2 transform -translate-y-1/2 size-2 rounded-full"
        />
      )}
    </SidebarMenuButton>
  );

  return (
    <SidebarMenuItem>
      {item.highlight ? (
        <div className="relative rounded-md p-[1px] overflow-hidden">
          <div className="absolute inset-0 rounded-md bg-[length:200%_200%] animate-[gradient-rotate_3s_linear_infinite] bg-gradient-to-r from-violet-500 via-amber-400 to-rose-500" />
          <div className="relative rounded-[5px] bg-sidebar">{button}</div>
        </div>
      ) : (
        button
      )}
    </SidebarMenuItem>
  );
};

function renderIcon(
  Icon: ComponentType<{ className?: string }>,
  ref: React.RefObject<AnimatedIconHandle | null>,
  iconClassName?: string,
) {
  return React.createElement(Icon, {
    className: cn('size-4 pointer-events-none', iconClassName),
    ref,
  } as { className: string });
}

type AnimatedIconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};
