import { t } from 'i18next';
import { ChevronDownIcon, ChevronUpIcon, VideoIcon } from 'lucide-react';
import React from 'react';
import { useLocation } from 'react-router-dom';

import TutorialsDialog from '@/components/custom/tutorials-dialog';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  SidebarSeparator,
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

export type SidebarItem = (
  | {
      label: string;
      type: 'title';
    }
  | (SidebarLinkProps & {
      type: 'link';
      show: boolean;
    })
  | SidebarGroup
) & {
  separatorBefore?: boolean;
  separatorAfter?: boolean;
};

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
  const showTutorials = location.pathname.startsWith('/project');
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
                    <React.Fragment key={item.label + index}>
                      {item.separatorBefore && <SidebarSeparator />}
                      {item.type === 'group' && (
                        <ApSidebarMenuGroup item={item} />
                      )}
                      {item.type === 'title' && (
                        <SidebarGroupLabel>{item.label}</SidebarGroupLabel>
                      )}
                      {item.type === 'link' && (
                        <ApSidebarMenuItem item={item} />
                      )}
                      {item.separatorAfter && <SidebarSeparator />}
                    </React.Fragment>
                  ))}
                  <SidebarMenu>
                    <SidebarInviteUserButton />
                  </SidebarMenu>
                  {showTutorials && (
                    <TutorialsDialog
                      location="tutorials-sidebar-item"
                      showTooltip={false}
                    >
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <div>
                            <SidebarMenuButton asChild>
                              <div className="flex items-center gap-2  cursor-pointer hover:bg-sidebar-accent rounded-sm transition-colors">
                                <VideoIcon></VideoIcon>
                                <span>{t('Tutorials')}</span>
                              </div>
                            </SidebarMenuButton>
                          </div>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </TutorialsDialog>
                  )}
                  <SidebarMenu>
                    <HelpAndFeedback />
                  </SidebarMenu>
                </ScrollArea>
              </div>
              <SidebarFooter className="pb-4 flex-shrink-0">
                {showProjectUsage && <UsageLimitsButton />}
                <SidebarUser />
              </SidebarFooter>
            </SidebarContent>
          </Sidebar>
        )}
        <div
          className={cn('bg-sidebar w-full h-full overflow-hidden', {
            'pt-2 pr-2 pb-2': !hideSideNav,
          })}
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
              console.log(`${item.label}`, open);
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
