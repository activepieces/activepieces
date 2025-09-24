import { LockKeyhole } from 'lucide-react';
import { ComponentType, SVGProps } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { BetaBadge } from '@/components/custom/beta-badge';
import { Dot } from '@/components/ui/dot';
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar-shadcn';

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

export const ApSidebarItem = (item: SidebarItemType) => {
  const location = useLocation();
  const isLinkActive =
    location.pathname.startsWith(item.to) || item.isActive?.(location.pathname);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className={`${
          isLinkActive && '!bg-primary/10 !text-primary'
        } px-2 py-5`}
      >
        <Link
          to={item.to}
          target={item.newWindow ? '_blank' : ''}
          rel={item.newWindow ? 'noopener noreferrer' : undefined}
        >
          <div className="w-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-2  w-full">
              <div className="flex items-center gap-2">
                {item.icon && <item.icon className="size-4" />}
                <span className="text-sm">{item.label}</span>
              </div>
              {item.isBeta && <BetaBadge showTooltip={false} />}
            </div>
            {item.locked && <LockKeyhole className="size-3.5" />}
          </div>
          {item.notification && !item.locked && (
            <Dot
              variant="destructive"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 size-2 rounded-full "
            />
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};
