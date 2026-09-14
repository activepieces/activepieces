import { Crown } from 'lucide-react';
import React, { ComponentType } from 'react';
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

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className={cn('pr-1', {
          'bg-sidebar-accent hover:bg-sidebar-accent!': active,
        })}
        onClick={() => navigate(to)}
      >
        {icon !== undefined &&
          React.createElement(icon, {
            className: 'size-4 pointer-events-none',
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

export type PlatformNavItemProps = {
  to: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  active: boolean;
  crowned: boolean;
};

export type PlatformNavSubItemProps = {
  to: string;
  label: string;
  active: boolean;
  crowned: boolean;
};
