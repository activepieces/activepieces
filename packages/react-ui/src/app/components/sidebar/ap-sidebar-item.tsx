import { LockKeyhole } from 'lucide-react';
import { ComponentType, SVGProps } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { buttonVariants } from '@/components/ui/button';
import { Dot } from '@/components/ui/dot';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
};

export const ApSidebarItem = (item: SidebarItemType) => {
  const location = useLocation();
  const { state } = useSidebar();
  const isLinkActive =
    location.pathname.startsWith(item.to) || item.isActive?.(location.pathname);
  const isCollapsed = state === 'collapsed';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <SidebarMenuItem
      onClick={handleClick}
      className={cn(isCollapsed && 'flex justify-center')}
    >
      {isCollapsed ? (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={item.to}
                target={item.newWindow ? '_blank' : ''}
                rel={item.newWindow ? 'noopener noreferrer' : undefined}
                onClick={handleClick}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'icon' }),
                  isLinkActive && 'bg-sidebar-accent hover:!bg-sidebar-accent',
                  'relative',
                )}
              >
                {item.icon && <item.icon className="size-5" />}
                {item.notification && !item.locked && (
                  <Dot
                    variant="destructive"
                    className="absolute right-1 top-1 size-2 rounded-full"
                  />
                )}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" align="center">
              {item.label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <SidebarMenuButton
          asChild
          onClick={handleClick}
          className={cn(
            'px-2 py-5',
            isLinkActive && 'bg-sidebar-accent hover:!bg-sidebar-accent',
          )}
        >
          <Link
            to={item.to}
            target={item.newWindow ? '_blank' : ''}
            rel={item.newWindow ? 'noopener noreferrer' : undefined}
            onClick={handleClick}
          >
            <div className="w-full flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 w-full">
                <div className="flex items-center gap-2">
                  {item.icon && <item.icon className="size-5" />}
                  <span className="text-sm">{item.label}</span>
                </div>
              </div>
              {item.locked && <LockKeyhole className="size-3.5" />}
            </div>
            {item.notification && !item.locked && (
              <Dot
                variant="destructive"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 size-2 rounded-full"
              />
            )}
          </Link>
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );
};
