import { t } from 'i18next';
import { ChevronsUpDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { buttonVariants } from '@/components/ui/button';
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
import { cn, determineDefaultRoute } from '@/lib/utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';

function SidebarLogoCollapsed({ linkTo }: { linkTo?: string }) {
  const branding = flagsHooks.useWebsiteBranding();
  const navigate = useNavigate();
  return (
    <SidebarMenuButton
      size="lg"
      onClick={() => navigate(linkTo || '/')}
      className="w-fit"
    >
      <img
        src={branding.logos.logoIconUrl}
        alt={t('home')}
        className="h-5 w-5 object-contain"
        draggable={false}
      />
    </SidebarMenuButton>
  );
}

function SidebarLogoFull({ linkTo }: { linkTo?: string }) {
  const branding = flagsHooks.useWebsiteBranding();
  return (
    <Link
      to={linkTo || '/'}
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'icon' }),
        'w-full flex items-center justify-start px-2 h-9',
      )}
    >
      <img
        src={branding.logos.fullLogoUrl}
        alt={t('home')}
        className="object-contain border"
        draggable={false}
      />
    </Link>
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
        <SidebarMenuItem>
          {state === 'collapsed' ? (
            <SidebarLogoCollapsed linkTo={defaultRoute} />
          ) : (
            <PlatformSwitcher>
              <SidebarMenuButton>
                {/* <div className="flex aspect-square size-8 items-center justify-center border rounded-md"> */}
                <img
                  src={branding.logos.logoIconUrl}
                  alt={currentPlatform?.name ?? t('platform')}
                  className="size-4 object-contain"
                  draggable={false}
                />
                {/* </div> */}
                <span className="truncate font-medium flex-1 text-left text-sm">
                  {currentPlatform?.name ?? t('platform')}
                </span>
                <ChevronsUpDown className="ml-auto size-3! shrink-0" />
              </SidebarMenuButton>
            </PlatformSwitcher>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
};
