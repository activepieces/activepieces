import { ChevronRightIcon } from 'lucide-react';
import React, { ComponentType, useEffect, useRef, useState } from 'react';
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
  icon?: ComponentType<{ className?: string }>;
  items: SidebarItemType[];
  type: 'group';
  open: boolean;
  setOpen: (open: boolean) => void;
  isActive?: (pathname: string) => boolean;
};

export function ApSidebareGroup(item: SidebarGroupType) {
  const location = useLocation();
  const iconRef = useRef<AnimatedIconHandle | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) {
      iconRef.current?.startAnimation?.();
    } else {
      iconRef.current?.stopAnimation?.();
    }
  }, [isHovered]);

  return (
    <Collapsible
      defaultOpen={item.isActive?.(location.pathname)}
      className="group/collapsible"
      onOpenChange={(open) => item.setOpen(open)}
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className="px-2 mb-1 py-5"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {item.icon && renderIcon(item.icon, iconRef)}
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

function renderIcon(
  Icon: ComponentType<{ className?: string }>,
  ref: React.RefObject<AnimatedIconHandle | null>,
) {
  return React.createElement(Icon, {
    className: 'size-4 pointer-events-none',
    ref,
  } as { className: string });
}

type AnimatedIconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};
