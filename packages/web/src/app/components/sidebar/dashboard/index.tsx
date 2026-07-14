import { PROJECT_COLOR_PALETTE } from '@activepieces/shared';
import { t } from 'i18next';
import {
  Compass,
  House,
  LineChart,
  MessageCircle,
  Plus,
  Search,
} from 'lucide-react';
import { Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ShieldIcon } from '@/components/icons/shield';
import { UserRoundPlusIcon } from '@/components/icons/user-round-plus';
import { useEmbedding } from '@/components/providers/embed-provider';
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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InviteUserDialog } from '@/features/members';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { CHAT_ROUTE } from '@/lib/route-utils';
import { cn } from '@/lib/utils';

import { RecentsList } from '../../../routes/chat-with-ai/components/recents-list';
import { recordAccess } from '../../global-search/access-history';
import {
  BrowsePanel,
  useGlobalSearch,
} from '../../global-search/global-search-context';
import { STATIC_PAGES } from '../../global-search/static-pages';
import { useUiPreferences } from '../../global-search/use-ui-preferences';
import { useChatNavigation } from '../../workspace-shell/use-chat-navigation';
import { ApSidebarItem, SidebarItemType } from '../ap-sidebar-item';
import { CreatePanel } from '../create/create-panel';
import { AppSidebarHeader } from '../sidebar-header';
import { SidebarUser } from '../sidebar-user';

export function ProjectDashboardSidebar({
  className,
}: { className?: string } = {}) {
  const { embedState } = useEmbedding();
  const { platform } = platformHooks.useCurrentPlatform();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const chatEnabled = platform.plan.chatEnabled;

  // Home is "start a fresh chat" — only meaningful when chat is available.
  const homeLink: SidebarItemType = {
    type: 'link',
    to: `${CHAT_ROUTE}?new=1`,
    label: t('Home'),
    show: true,
    icon: House,
    hasPermission: true,
    isSubItem: false,
    // Home just navigates back to a fresh chat — it's never a "selected" tab.
    isActive: () => false,
  };

  // Restored to the chat-first nav (main had these as sidebar links). Both are
  // full-page standalone routes, shown for every edition and regardless of chat.
  const exploreLink: SidebarItemType = {
    type: 'link',
    to: '/templates',
    label: t('Explore'),
    show: true,
    icon: Compass,
    hasPermission: true,
    isSubItem: false,
    onClick: () => recordStaticPageAccess('/templates'),
  };

  const impactLink: SidebarItemType = {
    type: 'link',
    to: '/impact',
    label: t('Impact'),
    show: true,
    icon: LineChart,
    hasPermission: true,
    isSubItem: false,
    onClick: () => recordStaticPageAccess('/impact'),
  };

  return (
    !embedState.hideSideNav && (
      <Sidebar
        collapsible="icon"
        id={SIDEBAR_ID}
        className={cn('max-h-[100vh] border-r-0!', className)}
      >
        <AppSidebarHeader />

        <SidebarContent className="gap-2 overflow-x-hidden pt-1">
          <SidebarGroup className="py-1">
            <SidebarMenu>
              <SidebarCreateItem />
            </SidebarMenu>
          </SidebarGroup>
          <SidebarSeparator className="mx-2 my-0" />
          <SidebarGroup className="py-1">
            <SidebarMenu className="gap-1.5">
              {chatEnabled && <ApSidebarItem {...homeLink} />}
              <SidebarSearchItem />
              <ApSidebarItem {...exploreLink} />
              <ApSidebarItem {...impactLink} />
              {/* Collapsed rail: a Chats icon opens the history popover.
                  Expanded: the inline "My Chats" list below replaces it. */}
              {chatEnabled && isCollapsed && <SidebarChatsItem />}
            </SidebarMenu>
          </SidebarGroup>
          <PinnedProjectsGroup />
          {chatEnabled && !isCollapsed && <SidebarChatHistory />}
        </SidebarContent>

        <SidebarFooter>
          <SidebarInviteTeammates />
          <SidebarPlatformAdminLink />
          <SidebarUser />
        </SidebarFooter>
      </Sidebar>
    )
  );
}

function SidebarCreateItem() {
  const [open, setOpen] = useState(false);
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <SidebarMenuItem>
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <SidebarMenuButton
                isActive={open}
                aria-label={t('Create')}
                className={cn(
                  'group/create',
                  isCollapsed
                    ? 'hover:bg-transparent active:bg-transparent data-active:bg-transparent'
                    : 'justify-center bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground active:text-primary-foreground data-active:bg-primary data-active:font-semibold data-active:text-primary-foreground data-open:hover:bg-primary/90',
                )}
              >
                {isCollapsed ? (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm transition-transform group-hover/create:scale-105">
                    <Plus className="size-3.5" strokeWidth={2.5} />
                  </span>
                ) : (
                  <>
                    <Plus className="size-4 shrink-0" strokeWidth={2.5} />
                    <span className="text-sm font-semibold">{t('Create')}</span>
                  </>
                )}
              </SidebarMenuButton>
            </PopoverTrigger>
          </TooltipTrigger>
          {!open && isCollapsed && (
            <TooltipContent side="right">{t('Create')}</TooltipContent>
          )}
        </Tooltip>
        <PopoverContent
          side="right"
          align="start"
          sideOffset={8}
          // Match SidebarChatsItem: don't auto-focus a tile on open (the zero-delay
          // TooltipProvider would instantly pop a tooltip + focus ring on it).
          onOpenAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(e) => {
            // Keep the create popover open when interacting with the nested project
            // selector popover / command list it spawns.
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
          className="w-[300px] rounded-2xl border-foreground/[0.08] bg-popover/95 p-3 shadow-2xl backdrop-blur-2xl"
        >
          <Suspense fallback={<CreatePanelSkeleton />}>
            <CreatePanel onClose={() => setOpen(false)} />
          </Suspense>
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  );
}

function CreatePanelSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-5 w-20" />
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function SidebarChatsItem() {
  const [open, setOpen] = useState(false);
  const { setOpen: setSidebarOpen } = useSidebar();
  const { selectedConversationId, selectConversation, newChat } =
    useChatNavigation();

  return (
    <SidebarMenuItem>
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <SidebarMenuButton isActive={open} aria-label={t('Chats')}>
                <MessageCircle className="size-4" />
              </SidebarMenuButton>
            </PopoverTrigger>
          </TooltipTrigger>
          {!open && <TooltipContent side="right">{t('Chats')}</TooltipContent>}
        </Tooltip>
        <PopoverContent
          side="right"
          align="start"
          sideOffset={8}
          // Don't auto-focus the first action button on open — with the sidebar's
          // zero-delay TooltipProvider that instantly pops its tooltip + focus ring,
          // making it look hovered.
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="flex max-h-[min(440px,66vh)] w-[248px] flex-col overflow-hidden rounded-2xl border-foreground/[0.08] bg-popover/95 p-0 shadow-2xl backdrop-blur-2xl"
        >
          <RecentsList
            surface="popover"
            className="flex-1"
            onNewChat={() => {
              setOpen(false);
              newChat();
            }}
            onExpandSidebar={() => {
              setOpen(false);
              setSidebarOpen(true);
            }}
            onSelect={(id) => {
              setOpen(false);
              selectConversation(id);
            }}
            selectedId={selectedConversationId}
          />
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  );
}

function SidebarChatHistory() {
  const { selectedConversationId, selectConversation } = useChatNavigation();

  return (
    <RecentsList
      collapsible
      className="flex-1"
      onSelect={selectConversation}
      selectedId={selectedConversationId}
    />
  );
}

function PinnedProjectsGroup() {
  const { prefs } = useUiPreferences();

  // Pinned by default; only an explicit opt-out (unpin) hides the projects.
  if (prefs.pinProjectSidebar === false) {
    return null;
  }

  // The projects live query suspends on cold load; a local boundary keeps that
  // from stalling the rest of the sidebar and shows a placeholder in place.
  return (
    <>
      <SidebarSeparator className="mx-2 my-1" />
      <Suspense fallback={<PinnedProjectsSkeleton />}>
        <PinnedProjectsList />
      </Suspense>
    </>
  );
}

function PinnedProjectsList() {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { data: projects = [] } = projectCollectionUtils.useAll();
  const activeProjectId = authenticationSession.getProjectId();

  if (projects.length === 0) {
    return null;
  }

  return (
    <SidebarGroup className="py-1">
      <SidebarMenu className="max-h-[30vh] gap-1 overflow-y-auto scrollbar-thin">
        {projects.map((project) => {
          const palette = project.icon
            ? PROJECT_COLOR_PALETTE[project.icon.color]
            : null;
          const name = getProjectName(project);
          return (
            <SidebarMenuItem key={project.id}>
              <SidebarMenuButton
                tooltip={name}
                isActive={project.id === activeProjectId}
                onClick={() => {
                  projectCollectionUtils.setCurrentProject(project.id);
                  navigate(`/projects/${project.id}/automations`);
                }}
              >
                <span
                  className="flex size-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold"
                  style={{
                    backgroundColor: palette?.color,
                    color: palette?.textColor,
                  }}
                >
                  {name.charAt(0).toUpperCase()}
                </span>
                {!isCollapsed && (
                  <span className="truncate text-sm">{name}</span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function PinnedProjectsSkeleton() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  return (
    <SidebarGroup className="py-1">
      <div className="flex flex-col gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1">
            <Skeleton className="size-5 shrink-0 rounded-md" />
            {!isCollapsed && <Skeleton className="h-4 flex-1" />}
          </div>
        ))}
      </div>
    </SidebarGroup>
  );
}

function SidebarSearchItem() {
  const { open: searchOpen, setOpen: setSearchOpen } = useGlobalSearch();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <SidebarMenuItem>
      <Popover open={searchOpen} onOpenChange={setSearchOpen} modal={false}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <SidebarMenuButton isActive={searchOpen} aria-label={t('Search')}>
                <Search className="size-4" />
                {!isCollapsed && (
                  <>
                    <span className="text-sm">{t('Search')}</span>
                    <kbd className="ml-auto rounded border border-border/60 bg-background/40 px-1 font-mono text-[10px] leading-none text-muted-foreground">
                      ⌘K
                    </kbd>
                  </>
                )}
              </SidebarMenuButton>
            </PopoverTrigger>
          </TooltipTrigger>
          {!searchOpen && (
            <TooltipContent side="right" className="flex items-center gap-2">
              {t('Search')}
              <kbd className="rounded border border-border/60 bg-background/20 px-1 font-mono text-[10px] leading-none">
                ⌘K
              </kbd>
            </TooltipContent>
          )}
        </Tooltip>
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
    </SidebarMenuItem>
  );
}

function SidebarInviteTeammates() {
  const { embedState } = useEmbedding();
  const isPlatformAdmin = useIsPlatformAdmin();
  const { state } = useSidebar();
  const [open, setOpen] = useState(false);
  const isCollapsed = state === 'collapsed';

  if (embedState.isEmbedded || !isPlatformAdmin) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={t('Invite teammates')}
          aria-label={t('Invite teammates')}
          onClick={() => setOpen(true)}
        >
          <UserRoundPlusIcon size={16} className="shrink-0" />
          {!isCollapsed && (
            <span className="text-sm">{t('Invite teammates')}</span>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
      <InviteUserDialog open={open} setOpen={setOpen} />
    </SidebarMenu>
  );
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
