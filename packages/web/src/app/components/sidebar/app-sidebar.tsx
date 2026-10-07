import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronsUpDown, PanelLeftClose, Search } from 'lucide-react';
import React, { ComponentType, useRef } from 'react';
import { Link } from 'react-router-dom';

import {
  ChevronLeftIcon,
  ChevronLeftIconHandle,
} from '@/components/icons/chevron-left';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SidebarUsageLimits } from '@/features/billing';
import { PlatformSwitcher } from '@/features/projects';
import { useRailOpenState } from '@/features/workspace/lib/rail-collapsed';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { determineDefaultRoute } from '@/lib/route-utils';
import { cn } from '@/lib/utils';

import { useGlobalSearch } from '../global-search/global-search-context';

import { AppNav, PlatformAdminNavItem } from './app-nav';
import { MobileSidebarBar } from './mobile-sidebar-bar';
import { PlatformNav } from './platform';
import { sidebarStyles } from './sidebar-styles';
import { SidebarUser } from './sidebar-user';

export function AppSidebar({ mode }: { mode: AppSidebarMode }) {
  const { embedState } = useEmbedding();
  const rail = useRailOpenState();
  const isPlatform = mode === 'platform';
  const isHidden =
    !isPlatform && (embedState.isEmbedded || embedState.hideSideNav);

  if (isHidden) {
    return null;
  }

  return (
    <SidebarProvider
      open={isPlatform || rail.open}
      onOpenChange={isPlatform ? keepOpen : rail.onOpenChange}
      keyboardShortcut={!isPlatform}
      shortcutIgnoresEditable
      className="contents"
      style={SIDEBAR_STYLE}
    >
      <TooltipProvider delayDuration={300}>
        <MobileSidebarBar />
        <Sidebar collapsible="icon" className="border-r-0">
          {mode === 'app' ? <AppHeader /> : <PlatformHeader />}
          <SidebarContent
            className={cn(
              sidebarStyles.scrollArea,
              'group-data-[collapsible=icon]:overflow-y-auto',
              isPlatform && sidebarStyles.fadeBottom,
            )}
          >
            {mode === 'app' ? <AppNav /> : <PlatformNav />}
          </SidebarContent>
          <SidebarFooter className="gap-1 overflow-hidden">
            {mode === 'app' ? (
              <AppFooterExtras />
            ) : (
              <SidebarSeparator className="mx-2 my-1" />
            )}
            <SidebarUser />
          </SidebarFooter>
        </Sidebar>
      </TooltipProvider>
    </SidebarProvider>
  );
}

function AppHeader() {
  const branding = flagsHooks.useWebsiteBranding();
  const { setOpen: setSearchOpen } = useGlobalSearch();
  const { embedState } = useEmbedding();
  const { state, isMobile, toggleSidebar, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed' && !isMobile;
  const closeMobileSheet = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  const openSearch = () => {
    closeMobileSheet();
    setSearchOpen(true);
  };
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { platform: currentPlatform } = platformHooks.useCurrentPlatform();
  const showSwitcher = edition === ApEdition.CLOUD && !embedState.isEmbedded;

  const logo = (
    <img
      src={branding.logos.logoIconUrl}
      alt=""
      className="size-5 max-w-none shrink-0"
      draggable={false}
    />
  );

  const brandButton =
    showSwitcher && !collapsed ? (
      <PlatformSwitcher>
        <SidebarMenuButton className={BRAND_BUTTON}>
          {logo}
          <span
            className={cn('min-w-0 flex-1 truncate', sidebarStyles.labelFade)}
          >
            {currentPlatform?.name ?? t('platform')}
          </span>
          <ChevronsUpDown className="text-gray-9" />
        </SidebarMenuButton>
      </PlatformSwitcher>
    ) : (
      <SidebarMenuButton
        asChild
        className={BRAND_BUTTON}
        tooltip={t('Open sidebar')}
      >
        <Link
          to="/"
          aria-label={collapsed ? t('Open sidebar') : undefined}
          onClick={(event) => {
            if (!collapsed) {
              closeMobileSheet();
              return;
            }
            event.preventDefault();
            event.stopPropagation();
            toggleSidebar();
          }}
        >
          {logo}
          <span className={sidebarStyles.labelFade}>
            {showSwitcher
              ? currentPlatform?.name ?? t('platform')
              : branding.websiteName}
          </span>
        </Link>
      </SidebarMenuButton>
    );

  return (
    <SidebarHeader className="gap-0 overflow-hidden">
      <SidebarMenu>
        <SidebarMenuItem>
          {brandButton}
          <HeaderActions>
            <HeaderIconButton
              label={t('Search')}
              icon={Search}
              onClick={openSearch}
            />
            <HeaderIconButton
              label={t('Close sidebar')}
              icon={PanelLeftClose}
              onClick={toggleSidebar}
            />
          </HeaderActions>
        </SidebarMenuItem>
      </SidebarMenu>
      <CollapsedOnlyRow>
        <SidebarMenuButton
          tooltip={t('Search')}
          aria-label={t('Search')}
          className="text-gray-11"
          onClick={(event) => {
            event.stopPropagation();
            openSearch();
          }}
        >
          <Search />
        </SidebarMenuButton>
      </CollapsedOnlyRow>
    </SidebarHeader>
  );
}

function PlatformHeader() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { checkAccess } = useAuthorization();
  const chevronRef = useRef<ChevronLeftIconHandle>(null);
  const defaultRoute = determineDefaultRoute({
    checkAccess,
    chatEnabled: platform.plan.chatEnabled,
  });

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link
              to={defaultRoute}
              onMouseEnter={() => chevronRef.current?.startAnimation()}
              onMouseLeave={() => chevronRef.current?.stopAnimation()}
            >
              <ChevronLeftIcon ref={chevronRef} className="size-4" size={16} />
              <span>{t('Back to app')}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}

function HeaderActions({ children }: { children: React.ReactNode }) {
  const { state, isMobile } = useSidebar();

  return (
    <div
      inert={state === 'collapsed' && !isMobile}
      className="absolute top-0 left-[calc(var(--sidebar-width)-1rem-4.125rem)] flex w-[4.125rem] items-center justify-end gap-0.5 transition-opacity duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[collapsible=icon]:opacity-0 motion-reduce:transition-none"
    >
      {children}
    </div>
  );
}

function CollapsedOnlyRow({ children }: { children: React.ReactNode }) {
  const { state, isMobile } = useSidebar();

  return (
    <div
      inert={state === 'expanded' || isMobile}
      className={sidebarStyles.showWhenCollapsed}
    >
      <div className="min-h-0 overflow-hidden">
        <SidebarMenu className="pt-1">
          <SidebarMenuItem>{children}</SidebarMenuItem>
        </SidebarMenu>
      </div>
    </div>
  );
}

function AppFooterExtras() {
  const { state, isMobile } = useSidebar();

  return (
    <>
      <div
        inert={state === 'collapsed' && !isMobile}
        className={sidebarStyles.hideWhenCollapsed}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="w-[calc(var(--sidebar-width)-1rem)]">
            <SidebarUsageLimits />
          </div>
        </div>
      </div>
      <PlatformAdminNavItem />
    </>
  );
}

function HeaderIconButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  const { isMobile } = useSidebar();
  const button = (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 shrink-0 rounded-md text-gray-11 hover:bg-gray-4 hover:text-gray-12"
      onClick={onClick}
      aria-label={label}
    >
      <Icon className="size-4" />
    </Button>
  );

  if (isMobile) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function keepOpen() {
  return undefined;
}

const BRAND_BUTTON =
  'px-1.5 pr-18 font-medium group-data-[collapsible=icon]:pr-1.5';

const SIDEBAR_STYLE: React.CSSProperties & {
  '--sidebar-width': string;
  '--sidebar-width-icon': string;
} = {
  '--sidebar-width': '15.5rem',
  '--sidebar-width-icon': '3rem',
};

export type AppSidebarMode = 'app' | 'platform';
