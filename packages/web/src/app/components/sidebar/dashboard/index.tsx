import { isNil, Permission } from '@activepieces/core-utils';
import { TemplateTelemetryEventType } from '@activepieces/shared';
import { t } from 'i18next';
import { Play, Plus, Search } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import { BoxIcon } from '@/components/icons/box';
import { ChartLineIcon } from '@/components/icons/chart-line';
import { CompassIcon } from '@/components/icons/compass';
import { FileJson2Icon } from '@/components/icons/file-json2';
import { ShieldIcon } from '@/components/icons/shield';
import { UnplugIcon } from '@/components/icons/unplug';
import { WorkflowIcon } from '@/components/icons/workflow';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import { projectCollectionUtils } from '@/features/projects';
import { templatesTelemetryApi } from '@/features/templates';
import {
  useAuthorization,
  useIsPlatformAdmin,
} from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { recordAccess } from '../../global-search/access-history';
import {
  BrowsePanel,
  useGlobalSearch,
} from '../../global-search/global-search-context';
import { STATIC_PAGES } from '../../global-search/static-pages';
import { useChatNavigation } from '../../workspace-shell/use-chat-navigation';
import { ApSidebarItem, SidebarItemType } from '../ap-sidebar-item';
import { AppSidebarHeader } from '../sidebar-header';
import SidebarUsageLimits from '../sidebar-usage-limits';
import { SidebarUser } from '../sidebar-user';

import { SidebarConversations } from './sidebar-conversations';

export function ProjectDashboardSidebar({
  className,
  collapsible = 'icon',
}: { className?: string; collapsible?: 'icon' | 'offcanvas' } = {}) {
  const { embedState } = useEmbedding();
  const { state } = useSidebar();
  const { data: currentUser } = userHooks.useCurrentUser();
  const { platform } = platformHooks.useCurrentPlatform();
  const { checkAccess } = useAuthorization();
  const { project } = projectCollectionUtils.useCurrentProject();
  const { newChat } = useChatNavigation();

  const handleExploreClick = useCallback(() => {
    templatesTelemetryApi.sendEvent({
      eventType: TemplateTelemetryEventType.EXPLORE_VIEW,
      userId: currentUser?.id,
    });
  }, [currentUser?.id]);

  const exploreLink: SidebarItemType = {
    type: 'link',
    to: '/templates',
    label: t('Explore'),
    show: true,
    icon: CompassIcon,
    hasPermission: true,
    isSubItem: false,
    onClick: () => {
      handleExploreClick();
      recordStaticPageAccess('/templates');
    },
  };

  const impactLink: SidebarItemType = {
    type: 'link',
    to: '/impact',
    label: t('Impact'),
    icon: ChartLineIcon,
    show: true,
    hasPermission: true,
    isSubItem: false,
    onClick: () => recordStaticPageAccess('/impact'),
  };

  const automationsLink: SidebarItemType = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/automations'),
    label: t('Automations'),
    icon: WorkflowIcon,
    show: true,
    hasPermission: checkAccess(Permission.READ_FLOW),
    isSubItem: false,
    isActive: (pathname) =>
      ['/automations', '/flows', '/tables'].some((section) =>
        pathname.includes(section),
      ),
  };

  const runsLink: SidebarItemType = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/runs'),
    label: t('Runs'),
    icon: Play,
    show: true,
    hasPermission: checkAccess(Permission.READ_RUN),
    isSubItem: false,
  };

  const connectionsLink: SidebarItemType = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/connections'),
    label: t('Connections'),
    icon: UnplugIcon,
    show: true,
    hasPermission: checkAccess(Permission.READ_APP_CONNECTION),
    isSubItem: false,
  };

  const variablesLink: SidebarItemType = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/variables'),
    label: t('Variables'),
    icon: FileJson2Icon,
    show: true,
    hasPermission: checkAccess(Permission.READ_VARIABLE),
    isSubItem: false,
  };

  const releasesLink: SidebarItemType = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/releases'),
    label: t('Releases'),
    icon: BoxIcon,
    show: project.releasesEnabled,
    hasPermission:
      project.releasesEnabled &&
      checkAccess(Permission.READ_PROJECT_RELEASE) &&
      !embedState.isEmbedded,
    isSubItem: false,
  };

  const generalItems = [exploreLink, impactLink]
    .filter((item) => item.show !== false)
    .filter((item) => isNil(item.hasPermission) || item.hasPermission);

  const projectItems = [
    automationsLink,
    runsLink,
    connectionsLink,
    variablesLink,
    releasesLink,
  ]
    .filter((item) => item.show !== false)
    .filter((item) => isNil(item.hasPermission) || item.hasPermission);

  const chatEnabled = platform.plan.chatEnabled;

  return (
    !embedState.hideSideNav && (
      <Sidebar
        collapsible={collapsible}
        id={SIDEBAR_ID}
        className={className}
        resizable
      >
        <AppSidebarHeader />

        <div className="relative z-10 shrink-0 bg-sidebar px-2 pt-2 pb-1 after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-1.5 after:bg-gradient-to-b after:from-sidebar after:to-transparent">
          <div className="flex items-center gap-1.5 group-data-[collapsible=icon]:justify-center">
            {chatEnabled && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 min-w-0 flex-1 justify-start gap-2 px-2 font-medium group-data-[collapsible=icon]:hidden"
                onClick={newChat}
              >
                <Plus className="size-4 shrink-0" />
                <span className="truncate text-xs">{t('New Chat')}</span>
              </Button>
            )}
            <SidebarSearchButton variant={chatEnabled ? 'compact' : 'full'} />
          </div>
        </div>

        <SidebarContent className="overflow-y-auto overflow-x-hidden">
          <SidebarGroup className="shrink-0 pt-1">
            <SidebarMenu>
              {generalItems.map((item) => (
                <ApSidebarItem key={item.label} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup className="mt-4 shrink-0 pt-0">
            <SidebarMenu>
              {projectItems.map((item) => (
                <ApSidebarItem key={item.label} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarConversations />
        </SidebarContent>
        <SidebarFooter className="border-t">
          {state === 'expanded' && <DelayedSidebarUsageLimits />}
          <SidebarPlatformAdminLink />
          <SidebarUser />
        </SidebarFooter>
      </Sidebar>
    )
  );
}

// Search trigger in the sticky action row: compact (icon-only, next to New Chat)
// or full width when chat is off. Opens the spotlight-style BrowsePanel.
function SidebarSearchButton({ variant }: { variant: 'compact' | 'full' }) {
  const { open: searchOpen, setOpen: setSearchOpen } = useGlobalSearch();

  return (
    <Popover open={searchOpen} onOpenChange={setSearchOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={t('Search')}
          className={
            variant === 'compact'
              ? 'h-8 w-8 shrink-0 px-0'
              : 'h-8 min-w-0 flex-1 justify-start gap-2 px-2 font-medium'
          }
        >
          <Search className="size-4 shrink-0" />
          {variant === 'full' && (
            <>
              <span className="truncate text-xs">{t('Search')}</span>
              <kbd className="ml-auto rounded border border-border/60 bg-background/40 px-1 font-mono text-[10px] leading-none text-muted-foreground">
                ⌘K
              </kbd>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="flex h-[min(480px,70vh)] w-[min(560px,calc(100vw-6rem))] flex-col overflow-hidden rounded-2xl border-foreground/[0.08] bg-popover/80 p-0 shadow-2xl backdrop-blur-2xl"
        onInteractOutside={(e) => {
          // Keep the popover open when interacting with nested overlays it
          // spawns (create/rename/move/delete dialogs, dropdown menus, toasts).
          const node = e.detail.originalEvent.target;
          if (
            node instanceof Element &&
            node.closest(
              '[data-radix-popper-content-wrapper],[role="dialog"],[role="alertdialog"],[data-sonner-toaster]',
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <BrowsePanel onClose={() => setSearchOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

function DelayedSidebarUsageLimits() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 250);
    return () => clearTimeout(timer);
  }, []);

  return show ? (
    <div>
      <SidebarUsageLimits />
    </div>
  ) : null;
}

function SidebarPlatformAdminLink() {
  const showPlatformAdmin = useIsPlatformAdmin();
  const { embedState } = useEmbedding();

  if (embedState.isEmbedded || !showPlatformAdmin) {
    return null;
  }

  return (
    <SidebarMenu>
      <ApSidebarItem
        type="link"
        to="/platform/projects"
        label={t('Platform Admin')}
        icon={ShieldIcon}
        isSubItem={false}
        show={true}
        hasPermission={true}
        onClick={() => {
          const page = STATIC_PAGES.find(
            (p) =>
              p.href === '/platform/projects' && p.id === 'page-platform-admin',
          );
          if (page)
            recordAccess({
              id: page.id,
              type: 'page',
              label: page.label,
              href: page.href,
            });
        }}
      />
    </SidebarMenu>
  );
}

function recordStaticPageAccess(href: string) {
  const page = STATIC_PAGES.find((p) => p.href === href);
  if (page) {
    recordAccess({
      id: page.id,
      type: 'page',
      label: page.label,
      href: page.href,
    });
  }
}

export const SIDEBAR_ID = 'project-sidebar';
