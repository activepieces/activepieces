import { ChevronRightIcon } from 'lucide-react';
import { ComponentType, SVGProps } from 'react';
import { useLocation } from 'react-router-dom';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar-shadcn';

import { ApSidebarItem, SidebarItemType } from './ap-sidebar-item';

export type SidebarGeneralItemType = SidebarItemType | SidebarGroupType;

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

export function ApSidebareGroup(item: SidebarGroupType) {
  const location = useLocation();
  return (
    <Collapsible
      defaultOpen={item.isActive?.(location.pathname)}
      className="group/collapsible"
      onOpenChange={(open) => item.setOpen(open)}
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="px-2 mb-1 py-5">
            {item.icon && <item.icon className="size-4" />}
            <span>{item.label}</span>
            <ChevronRightIcon
              className={`${item.open && 'rotate-90'} ml-auto duration-150`}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items.map(
              (link, index) =>
                link.show && (
                  <SidebarMenuSubItem key={link.label}>
                    <SidebarMenuButton asChild>
                      <ApSidebarItem
                        to={link.to}
                        label={link.label}
                        icon={link.icon}
                        key={index}
                        notification={link.notification}
                        locked={link.locked}
                        isActive={link.isActive}
                        type={link.type}
                      />
                    </SidebarMenuButton>
                  </SidebarMenuSubItem>
                ),
            )}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
