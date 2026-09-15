import { Crown } from 'lucide-react';
import React, { ComponentType, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar-shadcn';
import { cn } from '@/lib/utils';

export function PlatformNavItem({
  to,
  label,
  icon,
  active,
  crowned,
}: PlatformNavItemProps) {
  const navigate = useNavigate();
  const iconRef = useRef<AnimatedIconHandle | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) {
      iconRef.current?.startAnimation();
    } else {
      iconRef.current?.stopAnimation();
    }
  }, [isHovered]);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className={cn('pr-1', {
          'bg-sidebar-accent hover:bg-sidebar-accent!': active,
        })}
        onClick={() => navigate(to)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {icon !== undefined &&
          React.createElement(icon, {
            className: 'size-4 pointer-events-none',
            ref: iconRef,
          })}
        <span
          className={cn('flex-1 truncate text-sm', {
            'font-semibold': active,
          })}
        >
          {label}
        </span>
        {crowned && <Crown className="size-3.5! shrink-0 text-primary" />}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function PlatformNavSubItem({
  to,
  label,
  active,
  crowned,
}: PlatformNavSubItemProps) {
  const navigate = useNavigate();

  return (
    <SidebarMenuItem>
      <div className="flex items-stretch">
        <div className="ml-[15.6px] mr-1 w-px shrink-0 bg-sidebar-border" />
        <SidebarMenuButton
          className={cn('h-7 flex-1', {
            'bg-sidebar-accent hover:bg-sidebar-accent!': active,
          })}
          onClick={() => navigate(to)}
        >
          <span
            className={cn('text-sm text-muted-foreground', {
              'font-medium text-foreground': active,
            })}
          >
            {label}
          </span>
          {crowned && <Crown className="size-3! ml-auto text-primary" />}
        </SidebarMenuButton>
      </div>
    </SidebarMenuItem>
  );
}

export type AnimatedIconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

export type AnimatedIconComponent = ComponentType<{
  className?: string;
  ref?: React.Ref<AnimatedIconHandle>;
}>;

export type PlatformNavItemProps = {
  to: string;
  label: string;
  icon?: AnimatedIconComponent;
  active: boolean;
  crowned: boolean;
};

export type PlatformNavSubItemProps = {
  to: string;
  label: string;
  active: boolean;
  crowned: boolean;
};
