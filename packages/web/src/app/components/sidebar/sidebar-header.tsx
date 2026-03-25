import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronsUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import { PlatformSwitcher } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { determineDefaultRoute } from '@/lib/route-utils';

function SidebarLogoCollapsed({ linkTo }: { linkTo?: string }) {
  const branding = flagsHooks.useWebsiteBranding();
  const navigate = useNavigate();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate(linkTo || '/')}
      className="h-10! w-8! p-0! group-data-[collapsible=icon]:h-10! items-center justify-center"
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
  const { state } = useSidebar();
  const { platform: currentPlatform } = platformHooks.useCurrentPlatform();
  const { checkAccess } = useAuthorization();
  const defaultRoute = determineDefaultRoute(checkAccess);
  const branding = flagsHooks.useWebsiteBranding();

  if (!showSwitcher) {
    return (
      <SidebarHeader className="pb-0">
        <div className="w-full flex items-center gap-2">
          <SidebarLogoCollapsed linkTo={defaultRoute} />
          {state !== 'collapsed' && (
            <h1 className="truncate text-sm font-medium">
              {branding.websiteName}
            </h1>
          )}
        </div>
      </SidebarHeader>
    );
  }

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem className="flex items-center">
          <SidebarLogoCollapsed linkTo={defaultRoute} />
          {state !== 'collapsed' && (
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
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
};
