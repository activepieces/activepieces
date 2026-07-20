import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, PanelRightClose } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ApSidebarToggle } from '@/components/custom/ap-sidebar-toggle';
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
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { CHAT_ROUTE, determineDefaultRoute } from '@/lib/route-utils';

function SidebarLogo({ linkTo }: { linkTo?: string }) {
  const branding = flagsHooks.useWebsiteBranding();
  const navigate = useNavigate();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t('home')}
      onClick={() => navigate(linkTo || '/')}
      className="h-8! w-8! p-0! items-center justify-center"
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

export const AppSidebarHeader = () => {
  const { embedState } = useEmbedding();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const showSwitcher = edition === ApEdition.CLOUD && !embedState.isEmbedded;
  const { state, isHoverExpanded, setOpen } = useSidebar();
  const { platform: currentPlatform } = platformHooks.useCurrentPlatform();
  const { checkAccess } = useAuthorization();
  // Home is a fresh chat when chat is on; otherwise the classic default route.
  const homeRoute = currentPlatform.plan.chatEnabled
    ? `${CHAT_ROUTE}?new=1`
    : determineDefaultRoute({ checkAccess });
  const branding = flagsHooks.useWebsiteBranding();

  const platformNameContent = showSwitcher ? (
    <div className="flex-1 min-w-0">
      <PlatformSwitcher>
        <SidebarMenuButton className="group/platform-switcher h-8! w-full">
          <span className="truncate font-medium flex-1 text-left text-sm">
            {currentPlatform?.name ?? t('platform')}
          </span>
          <ChevronDown className="ml-auto hidden size-4 shrink-0 group-hover/platform-switcher:block" />
        </SidebarMenuButton>
      </PlatformSwitcher>
    </div>
  ) : (
    <h1 className="flex-1 min-w-0 truncate text-sm font-medium">
      {branding.websiteName}
    </h1>
  );

  return (
    <SidebarHeader className="h-12 justify-center border-b px-2 py-0 group-data-[collapsible=icon]:px-1">
      <div className="flex w-full items-center gap-1 group-data-[collapsible=icon]:flex-col">
        <SidebarLogo linkTo={homeRoute} />
        {state !== 'collapsed' && platformNameContent}
        {isHoverExpanded ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
                <PanelRightClose size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('Open Sidebar')}</TooltipContent>
          </Tooltip>
        ) : (
          <ApSidebarToggle />
        )}
      </div>
    </SidebarHeader>
  );
};
