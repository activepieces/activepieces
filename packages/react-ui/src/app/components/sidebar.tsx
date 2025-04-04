import { QuestionMarkCircledIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLink,
  FileTextIcon,
  LockKeyhole,
  Settings,
} from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { BetaBadge } from '@/components/custom/beta-badge';
import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuSubItem,
  SidebarMenuSub,
  SidebarMenuItem,
  SidebarMenuAction,
} from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ProjectSwitcher } from '@/features/projects/components/project-switcher';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn, determineDefaultRoute } from '@/lib/utils';
import { ApFlagId, ApEdition, supportUrl } from '@activepieces/shared';

import { ShowPoweredBy } from '../../components/show-powered-by';
import { platformHooks } from '../../hooks/platform-hooks';

import { SidebarInviteUserButton } from './sidebar-invite-user';
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
const CustomTooltipLink = ({
  to,
  label,
  Icon,
  extraClasses,
  notification,
  locked,
  newWindow,
  isActive,
  isSubItem,
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
          'relative flex items-center gap-1 justify-between hover:bg-accent hover:text-primary rounded-lg transition-colors',
          extraClasses,
          isLinkActive && '!bg-primary/10 !text-primary',
        )}
      >
        <div
          className={`w-full flex items-center justify-between gap-2 p-2 ${
            !Icon ? 'p-2' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            {Icon && <Icon className={`size-5`} />}
            <span className={`text-sm`}>{label}</span>
            {(label === 'Tables' || label === 'Todos' || label === 'MCP') && (
              <span className="ml-2">
                <BetaBadge showTooltip={false} />
              </span>
            )}
          </div>
          {locked && <LockKeyhole className="size-3" color="grey" />}
        </div>
        {notification && !locked && (
          <span className="bg-destructive mr-1 size-2 rounded-full "></span>
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
};

export type SidebarLink = {
  to: string;
  label: string;
  icon?: React.ElementType;
  type: 'link';
  notification?: boolean;
  locked?: boolean;
  hasPermission?: boolean;
  showInEmbed?: boolean;
  isSubItem: boolean;
  isActive?: (pathname: string) => boolean;
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
  const branding = flagsHooks.useWebsiteBranding();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { embedState } = useEmbedding();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: showCommunity } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );
  const { data: showBilling } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_BILLING,
  );
  const defaultRoute = determineDefaultRoute(useAuthorization().checkAccess);
  const location = useLocation();
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex min-h-screen w-full">
        {!hideSideNav && (
          <Sidebar className="w-[255px]">
            <SidebarContent>
              <SidebarHeader className="pt-4 pb-0">
                <div className="flex items-center justify-center">
                  <Link
                    to={isHomeDashboard ? defaultRoute : '/platform'}
                    className="h-[48px] flex items-center justify-center"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" className="p-2 h-auto">
                          {edition !== ApEdition.COMMUNITY &&
                          !embedState.isEmbedded ? (
                            <img
                              src={branding.logos.logoIconUrl}
                              alt={t('home')}
                              width={28}
                              height={28}
                              className=" max-h-[28px] max-w-[28px] object-contain"
                            />
                          ) : (
                            <img
                              src={branding.logos.fullLogoUrl}
                              alt={t('home')}
                              width={160}
                              height={51}
                              className="max-h-[51px] max-w-[160px] object-contain"
                            />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{t('Home')}</TooltipContent>
                    </Tooltip>
                  </Link>
                  <ProjectSwitcher />
                </div>
              </SidebarHeader>
              <SidebarContent className="gap-0">
                <ScrollArea className="h-[calc(100vh-100px)]">
                  {items.map((item, index) =>
                    item.type === 'group' ? (
                      <SidebarGroup key={item.name} className="py-2">
                        {item.name && (
                          <SidebarGroupLabel>{item.name}</SidebarGroupLabel>
                        )}
                        <SidebarMenu className="py-0">
                          <Collapsible
                            defaultOpen={
                              item.defaultOpen ||
                              item.isActive?.(location.pathname)
                            }
                            className="group/collapsible"
                            onOpenChange={(open) => {
                              item.setOpen(open);
                            }}
                          >
                            <SidebarMenuItem>
                              <CollapsibleTrigger asChild>
                                <SidebarMenuButton className="py-0 gap-2 hover:bg-accent hover:text-primary rounded-lg transition-colors">
                                  {item.icon && (
                                    <item.icon className="size-5" />
                                  )}
                                  <span>{item.label}</span>
                                  <SidebarMenuAction>
                                    {item.open ? (
                                      <ChevronUpIcon />
                                    ) : (
                                      <ChevronDownIcon />
                                    )}
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
                    ) : (
                      <SidebarGroup key={item.label} className="py-1">
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
                    ),
                  )}
                </ScrollArea>
              </SidebarContent>
              <SidebarFooter className="pb-4 gap-4">
                <SidebarMenu>
                  <SidebarMenuItem className="hover:bg-accent hover:text-primary rounded-lg transition-colors">
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname.includes('/settings/')}
                    >
                      <Link
                        to={authenticationSession.appendProjectRoutePrefix(
                          '/settings/general',
                        )}
                        className="flex items-center gap-2"
                      >
                        <Settings className="!size-5" />
                        <span>{t('Project Settings')}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarPlatformAdminButton />
                  <SidebarInviteUserButton />
                  <Separator />
                  {showCommunity && (
                    <>
                      <SidebarMenuItem className="hover:bg-accent hover:text-primary rounded-lg transition-colors">
                        <SidebarMenuButton asChild>
                          <Link
                            to={supportUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <QuestionMarkCircledIcon className="size-5" />
                              <span>{t('Community Support')}</span>
                            </div>
                            <ExternalLink className="size-5" />
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem className="hover:bg-accent hover:text-primary rounded-lg transition-colors">
                        <SidebarMenuButton asChild>
                          <Link
                            to="https://activepieces.com/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <FileTextIcon className="size-5" />
                              <span>{t('Docs')}</span>
                            </div>
                            <ExternalLink className="size-5" />
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </>
                  )}
                </SidebarMenu>
                {showBilling && <Separator />}
                {showBilling && (
                  <SidebarMenu>
                    <UsageLimitsButton />
                  </SidebarMenu>
                )}

                <SidebarUser />
              </SidebarFooter>
            </SidebarContent>
          </Sidebar>
        )}
        <div
          className={cn('flex-1 p-4 py-6', {
            'py-3': hideHeader,
            'px-0': removeGutters,
            'pb-0': removeBottomPadding,
          })}
        >
          {children}
        </div>
      </div>
      <ShowPoweredBy show={platform?.showPoweredBy && isHomeDashboard} />
    </div>
  );
}
