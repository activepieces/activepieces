import { t } from 'i18next';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Link2,
  LockKeyhole,
  Settings,
} from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { BetaBadge } from '@/components/custom/beta-badge';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { Dot } from '@/components/ui/dot';
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
  SidebarSeparator,
} from '@/components/ui/sidebar-shadcn';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
import { ApEdition, ApFlagId, Permission } from '@activepieces/shared';

import { ShowPoweredBy } from '../../components/show-powered-by';
import { platformHooks } from '../../hooks/platform-hooks';

import { ApDashboardSidebarHeader } from './ap-dashboard-sidebar-header';
import { HelpAndFeedback } from './help-and-feedback';
import { SidebarPlatformAdminButton } from './sidebar-platform-admin';
import { SidebarUser } from './sidebar-user';
import UsageLimitsButton from './usage-limits-button';

type Link = {
  icon: React.ReactNode;
  label: string;
  to: string;
  notification?: boolean;
};

type CustomTooltipLinkProps = {
  to: string;
  label: string;
  Icon?: React.ElementType;
  extraClasses?: string;
  notification?: boolean;
  locked?: boolean;
  newWindow?: boolean;
  isActive?: (pathname: string) => boolean;
  isSubItem: boolean;
};
export const CustomTooltipLink = ({
  to,
  label,
  Icon,
  extraClasses,
  notification,
  locked,
  newWindow,
  isActive,
}: CustomTooltipLinkProps) => {
  const location = useLocation();

  const isLinkActive =
    location.pathname.startsWith(to) || isActive?.(location.pathname);
  return (
    <Link
      to={to}
      target={newWindow ? '_blank' : ''}
      rel={newWindow ? 'noopener noreferrer' : ''}
    >
      <div
        className={cn(
          'relative flex items-center gap-1 justify-between hover:bg-accent rounded-lg transition-colors',
          extraClasses,
          isLinkActive && '!bg-primary/10 !text-primary',
        )}
      >
        <div
          className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 ${
            !Icon ? 'p-2' : ''
          }`}
        >
          <div className="flex items-center gap-2 justify-between w-full">
            <div className="flex items-center gap-2">
              {Icon && <Icon className={`size-4`} />}
              <span className={`text-sm`}>{label}</span>
            </div>
            {(label === 'Tables' || label === 'Todos' || label === 'MCP') && (
              <BetaBadge showTooltip={false} />
            )}
          </div>
          {locked && (
            <LockKeyhole className="size-4 stroke-[2px]" color="grey" />
          )}
        </div>
        {notification && !locked && (
          <Dot
            variant="destructive"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 size-2 rounded-full "
          />
        )}
      </div>
    </Link>
  );
};

export type SidebarGroup = {
  name?: string;
  putEmptySpaceTop?: boolean;
  label: string;
  icon: React.ElementType;
  items: SidebarLink[];
  type: 'group';
  defaultOpen: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  isActive?: (pathname: string) => boolean;
  separatorBefore?: boolean;
  separatorAfter?: boolean;
};

export type SidebarLink = {
  to: string;
  label: string;
  name?: string;
  icon?: React.ElementType;
  type: 'link';
  notification?: boolean;
  locked?: boolean;
  hasPermission?: boolean;
  showInEmbed?: boolean;
  isSubItem: boolean;
  isActive?: (pathname: string) => boolean;
  separatorBefore?: boolean;
  separatorAfter?: boolean;
};

export type SidebarItem = SidebarLink | SidebarGroup;

type SidebarProps = {
  children: React.ReactNode;
  items: SidebarItem[];
  isHomeDashboard?: boolean;
  hideSideNav?: boolean;
  hideHeader?: boolean;
  removeGutters?: boolean;
  removeBottomPadding?: boolean;
};
export function SidebarComponent({
  children,
  items,
  isHomeDashboard = false,
  hideSideNav = false,
  hideHeader = false,
  removeGutters = false,
  removeBottomPadding = false,
}: SidebarProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const location = useLocation();
  const { checkAccess } = useAuthorization();

  const showProjectUsage =
    location.pathname.startsWith('/project') && edition !== ApEdition.COMMUNITY;
  const showConnectionsLink =
    location.pathname.startsWith('/project') &&
    checkAccess(Permission.READ_APP_CONNECTION);

  return (
    <div className="flex min-h-screen w-full">
      <div className="flex min-h-screen w-full">
        {!hideSideNav && (
          <Sidebar>
            <SidebarContent>
              <ApDashboardSidebarHeader isHomeDashboard={isHomeDashboard} />
              <SidebarSeparator />
              <SidebarContent className="gap-0">
                <ScrollArea className="h-[calc(100vh-100px)]">
                  {items.map((item, index) => (
                    <React.Fragment key={item.label}>
                      {item.separatorBefore && <SidebarSeparator />}
                      {item.type === 'group'
                        ? ApSidebarMenuGroup(item)
                        : ApSidebarMenuItem(item, index)}
                      {item.separatorAfter && <SidebarSeparator />}
                    </React.Fragment>
                  ))}

                  <SidebarGroup>
                    <SidebarGroupLabel>{t('Misc')}</SidebarGroupLabel>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <SidebarPlatformAdminButton />
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      {!location.pathname.startsWith('/platform') && (
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild>
                            <CustomTooltipLink
                              to={authenticationSession.appendProjectRoutePrefix(
                                '/settings/general',
                              )}
                              label={t('Project Settings')}
                              Icon={Settings}
                              isSubItem={false}
                            />
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )}
                      {showConnectionsLink && (
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild>
                            <CustomTooltipLink
                              to={authenticationSession.appendProjectRoutePrefix(
                                '/connections',
                              )}
                              label={t('Connections')}
                              Icon={Link2}
                              isSubItem={false}
                            />
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )}
                    </SidebarMenu>
                  </SidebarGroup>
                </ScrollArea>
              </SidebarContent>
              <SidebarFooter className="pb-4 gap-4">
                <SidebarMenu>
                  <HelpAndFeedback />
                </SidebarMenu>
                {showProjectUsage && <Separator />}
                {showProjectUsage && (
                  <SidebarMenu>
                    <UsageLimitsButton />
                  </SidebarMenu>
                )}
                {showProjectUsage && <Separator />}
                <SidebarUser />
              </SidebarFooter>
            </SidebarContent>
          </Sidebar>
        )}
        <div
          className={cn('flex-1 px-10 py-6', {
            'py-3': hideHeader,
            'px-0': removeGutters,
            'pb-0': removeBottomPadding,
          })}
        >
          {children}
        </div>
      </div>
      <ShowPoweredBy
        show={platform?.showPoweredBy && isHomeDashboard}
        position="absolute"
      />
    </div>
  );
}
function ApSidebarMenuItem(item: SidebarLink, index: number) {
  return (
    <React.Fragment key={item.label}>
      <SidebarGroup key={item.label} className="py-1">
        {item.name && <SidebarGroupLabel>{item.name}</SidebarGroupLabel>}
        <SidebarMenu className="gap-0 p-0">
          <SidebarMenuItem key={item.label}>
            <SidebarMenuButton asChild>
              <CustomTooltipLink
                to={item.to}
                label={item.label}
                Icon={item.icon}
                key={index}
                notification={item.notification}
                locked={item.locked}
                isActive={item.isActive}
                isSubItem={item.isSubItem}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </React.Fragment>
  );
}

function ApSidebarMenuGroup(item: SidebarGroup) {
  const location = useLocation();
  return (
    <React.Fragment key={item.label}>
      <SidebarGroup key={item.name} className="py-2">
        {item.name && <SidebarGroupLabel>{item.name}</SidebarGroupLabel>}
        <SidebarMenu className="py-0">
          <Collapsible
            defaultOpen={item.defaultOpen || item.isActive?.(location.pathname)}
            className="group/collapsible"
            onOpenChange={(open) => {
              item.setOpen(open);
            }}
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton className="py-0 gap-2 hover:bg-gray-200 rounded-lg transition-colors">
                  {item.icon && <item.icon className="size-4" />}
                  <span>{item.label}</span>
                  <SidebarMenuAction asChild>
                    {item.open ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  </SidebarMenuAction>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items.map((link, index) => (
                    <SidebarMenuSubItem key={link.label}>
                      <SidebarMenuButton asChild>
                        <CustomTooltipLink
                          to={link.to}
                          label={link.label}
                          Icon={link.icon}
                          key={index}
                          notification={link.notification}
                          locked={link.locked}
                          isActive={link.isActive}
                          isSubItem={link.isSubItem}
                        />
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroup>
    </React.Fragment>
  );
}
