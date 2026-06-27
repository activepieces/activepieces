import { t } from 'i18next';
import { House, LayoutGrid } from 'lucide-react';
import { useState } from 'react';

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
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InviteUserDialog } from '@/features/members';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { CHAT_ROUTE } from '@/lib/route-utils';
import { cn } from '@/lib/utils';

import { recordAccess } from '../../global-search/access-history';
import {
  BrowsePanel,
  useGlobalSearch,
} from '../../global-search/global-search-context';
import { STATIC_PAGES } from '../../global-search/static-pages';
import { ApSidebarItem, SidebarItemType } from '../ap-sidebar-item';
import { AppSidebarHeader } from '../sidebar-header';
import { SidebarUser } from '../sidebar-user';

export function ProjectDashboardSidebar({
  className,
}: { className?: string } = {}) {
  const { embedState } = useEmbedding();

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

  return (
    !embedState.hideSideNav && (
      <Sidebar
        collapsible="icon"
        id={SIDEBAR_ID}
        className={cn('max-h-[100vh] border-r-0!', className)}
      >
        <AppSidebarHeader />

        <SidebarContent className="overflow-x-hidden">
          <SidebarGroup>
            <SidebarMenu>
              <ApSidebarItem {...homeLink} />
              <SidebarBrowseItem />
            </SidebarMenu>
          </SidebarGroup>
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

function SidebarBrowseItem() {
  const { open, setOpen } = useGlobalSearch();
  return (
    <SidebarMenuItem>
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <SidebarMenuButton isActive={open} aria-label={t('Browse')}>
                <LayoutGrid className="size-4" />
              </SidebarMenuButton>
            </PopoverTrigger>
          </TooltipTrigger>
          {!open && (
            <TooltipContent side="right" className="flex items-center gap-2">
              {t('Browse')}
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
          className="flex h-[min(560px,78vh)] w-[min(640px,calc(100vw-6rem))] flex-col overflow-hidden rounded-2xl border-foreground/[0.08] bg-popover/80 p-0 shadow-2xl backdrop-blur-2xl"
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
          <BrowsePanel onClose={() => setOpen(false)} />
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
      <InviteUserDialog
        open={open}
        setOpen={setOpen}
        scope={{ kind: 'platform' }}
      />
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

export const SIDEBAR_ID = 'project-sidebar';
