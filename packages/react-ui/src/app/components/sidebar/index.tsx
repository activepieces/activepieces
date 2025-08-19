import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import React from 'react';
import { useLocation } from 'react-router-dom';

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuSubItem,
  SidebarMenuSub,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarLinkProps,
} from '@/components/ui/sidebar-shadcn';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';

import { ShowPoweredBy } from '../../../components/show-powered-by';
import { platformHooks } from '../../../hooks/platform-hooks';
import { ApDashboardSidebarHeader } from '../ap-dashboard-sidebar-header';
import { HelpAndFeedback } from '../help-and-feedback';

import { SidebarInviteUserButton } from './sidebar-invite-user';
import { SidebarUser } from './sidebar-user';
import UsageLimitsButton from './usage-limits-button';

export type SidebarItem =
  | {
      type: 'separator';
    }
  | (SidebarLinkProps & {
      type: 'link';
      show: boolean;
    })
  | SidebarGroup;

export type SidebarGroup = {
  name?: string;
  putEmptySpaceTop?: boolean;
  label: string;
  Icon: React.ReactElement<{ className?: string }>;
  items: SidebarItem[];
  type: 'group';
  defaultOpen: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  isActive?: (pathname: string) => boolean;
};

type SidebarProps = {
  children: React.ReactNode;
  items: SidebarItem[];
  isHomeDashboard?: boolean;
  hideSideNav?: boolean;
};
export function SidebarComponent({
  children,
  items,
  isHomeDashboard = false,
  hideSideNav = false,
}: SidebarProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  const location = useLocation();
  const showProjectUsage =
    location.pathname.startsWith('/project') && edition !== ApEdition.COMMUNITY;
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="flex h-screen w-full">
        {!hideSideNav && (
          <Sidebar className="h-screen">
            <SidebarContent className="h-full  flex flex-col">
              <ApDashboardSidebarHeader isHomeDashboard={isHomeDashboard} />
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full  px-2">
                  {items.map((item, index) => (
                    <React.Fragment key={item.type + index}>
                      {item.type === 'group' && (
                        <ApSidebarMenuGroup item={item} />
                      )}
                      {item.type === 'separator' && (
                        <Separator className="my-1.5" />
                      )}
                      {item.type === 'link' && (
                        <ApSidebarMenuItem item={item} />
                      )}
                    </React.Fragment>
                  ))}
                </ScrollArea>
              </div>
              <SidebarFooter className="pb-4 flex-shrink-0">
                <SidebarMenu>
                  <SidebarInviteUserButton />
                </SidebarMenu>

                <SidebarMenu>
                  <HelpAndFeedback />
                </SidebarMenu>
                {showProjectUsage && <UsageLimitsButton />}
                <SidebarUser />
              </SidebarFooter>
            </SidebarContent>
          </Sidebar>
        )}
        <div
          className={cn(
            'bg-gray-50 dark:bg-zinc-950  w-full h-full overflow-hidden',
            {
              'pt-2 pr-2 pb-2': !hideSideNav,
            },
          )}
        >
          <ScrollArea
            className={cn('w-full pb-6 pt-28 px-6 h-full bg-background', {
              'rounded-lg border-b-0 border': !hideSideNav,
            })}
            style={{
              boxShadow: hideSideNav
                ? '0 2px 2px #0000000a,0 8px 8px -8px #0000000a'
                : 'none',
            }}
          >
            {children}
          </ScrollArea>
        </div>
      </div>
      <ShowPoweredBy
        show={platform?.plan.showPoweredBy && isHomeDashboard}
        position="absolute"
      />
    </div>
  );
}
const ApSidebarMenuItem = ({ item }: { item: SidebarLinkProps }) => {
  return (
    <SidebarMenu className="mt-1">
      <SidebarMenuItem key={item.label}>
        <SidebarMenuButton {...item} />
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
const ApSidebarMenuGroup = ({ item }: { item: SidebarGroup }) => {
  const location = useLocation();
  return (
    <React.Fragment key={item.label}>
      <SidebarGroup key={item.name}>
        {item.name && <SidebarGroupLabel>{item.name}</SidebarGroupLabel>}
        <SidebarMenu>
          <Collapsible
            defaultOpen={item.defaultOpen || item.isActive?.(location.pathname)}
            className="group/collapsible"
            onOpenChange={(open) => {
              item.setOpen(open);
            }}
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <div className="mb-2">
                  <SidebarMenuButton asChild>
                    {item.Icon}
                    <span>{item.label}</span>
                    <SidebarMenuAction asChild>
                      {item.open ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </SidebarMenuAction>
                  </SidebarMenuButton>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items.map(
                    (link, index) =>
                      link.type === 'link' &&
                      link.show && (
                        <SidebarMenuSubItem key={link.label + index}>
                          <SidebarMenuButton {...link} />
                        </SidebarMenuSubItem>
                      ),
                  )}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroup>
    </React.Fragment>
  );
};
