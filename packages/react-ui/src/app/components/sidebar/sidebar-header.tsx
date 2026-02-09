import { t } from 'i18next';
import { ChevronsUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import { PlatformSwitcher } from '@/features/projects/components/platform-switcher';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { determineDefaultRoute } from '@/lib/utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';

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

function SidebarLogoFull({ linkTo }: { linkTo?: string }) {
  const branding = flagsHooks.useWebsiteBranding();
  const navigate = useNavigate();

  return (
    <SidebarMenuButton
      onClick={() => navigate(linkTo || '/')}
      className="h-10! group-data-[collapsible=icon]:h-10! justify-center items-center"
    >
      <img
        src={branding.logos.fullLogoUrl}
        alt={t('home')}
        className="h-8 object-contain animate-in fade-in duration-100 delay-[100ms] fill-mode-backwards"
        draggable={false}
      />
    </SidebarMenuButton>
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

  if (!showSwitcher) {
    return (
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {state === 'collapsed' ? (
              <SidebarLogoCollapsed />
            ) : (
              <SidebarLogoFull />
            )}
          </SidebarMenuItem>
        </SidebarMenu>
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
