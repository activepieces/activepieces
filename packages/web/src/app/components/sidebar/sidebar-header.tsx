import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronsLeft, ChevronsRight, ChevronsUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import {
  SidebarHeader,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PlatformSwitcher } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { CHAT_ROUTE } from '@/lib/route-utils';

// Collapsed: the logo is the expand affordance — it cross-fades to an expand icon while the
// rail is hovered and expands the sidebar on click. Expanded: the logo returns to a plain
// brand mark that navigates home.
function SidebarLogo() {
  const branding = flagsHooks.useWebsiteBranding();
  const navigate = useNavigate();
  const { platform } = platformHooks.useCurrentPlatform();
  const { state, setOpen } = useSidebar();
  const isCollapsed = state === 'collapsed';
  // Home is a fresh chat when chat is on; otherwise the classic project home.
  const goHome = () =>
    navigate(
      platform.plan.chatEnabled
        ? `${CHAT_ROUTE}?new=1`
        : authenticationSession.appendProjectRoutePrefix('/automations'),
    );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('Expand sidebar')}
            onClick={() => setOpen(true)}
            className="relative h-10! w-8! p-0! items-center justify-center"
          >
            <img
              src={branding.logos.logoIconUrl}
              alt={t('home')}
              className="h-5! w-5! shrink-0 transition-opacity duration-150 group-hover:opacity-0"
              draggable={false}
            />
            <ChevronsRight className="absolute size-[18px] opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{t('Expand sidebar')}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t('home')}
      onClick={goHome}
      className="h-10! w-8! p-0! items-center justify-center"
    >
      <img
        src={branding.logos.logoIconUrl}
        alt={t('home')}
        className="h-5! w-5! shrink-0"
        draggable={false}
      />
    </Button>
  );
}

function SidebarCollapseButton() {
  const { setOpen } = useSidebar();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('Collapse sidebar')}
          onClick={() => setOpen(false)}
          className="h-7 w-7 shrink-0"
        >
          <ChevronsLeft className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{t('Collapse sidebar')}</TooltipContent>
    </Tooltip>
  );
}

export const AppSidebarHeader = () => {
  const { embedState } = useEmbedding();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const showSwitcher = edition === ApEdition.CLOUD && !embedState.isEmbedded;
  const { state } = useSidebar();
  const { platform: currentPlatform } = platformHooks.useCurrentPlatform();
  const branding = flagsHooks.useWebsiteBranding();
  const isCollapsed = state === 'collapsed';

  return (
    <SidebarHeader className="pb-0">
      <div className="w-full flex items-center gap-2">
        <SidebarLogo />
        {!isCollapsed && (
          <>
            {showSwitcher ? (
              <div className="flex-1 min-w-0">
                <PlatformSwitcher>
                  <SidebarMenuButton className="h-10! w-full">
                    <span className="truncate font-medium flex-1 text-left text-sm">
                      {currentPlatform?.name ?? t('platform')}
                    </span>
                    <ChevronsUpDown className="ml-auto size-3! shrink-0" />
                  </SidebarMenuButton>
                </PlatformSwitcher>
              </div>
            ) : (
              <h1 className="flex-1 truncate text-sm font-medium">
                {branding.websiteName}
              </h1>
            )}
            <SidebarCollapseButton />
          </>
        )}
      </div>
    </SidebarHeader>
  );
};
