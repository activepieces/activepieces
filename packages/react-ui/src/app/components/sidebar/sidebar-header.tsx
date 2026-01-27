import { t } from 'i18next';
import { ChevronsUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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

  return (
    <Link
      to={linkTo || '/'}
      className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
    >
      <img
        src={branding.logos.logoIconUrl}
        alt={t('home')}
        className="h-5 w-5 object-contain"
        draggable={false}
      />
    </Link>
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
        className="h-9 w-full object-contain"
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

  if (!showSwitcher) {
    return (
      <SidebarHeader
        className="relative w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <SidebarMenu className="w-full">
          <SidebarMenuItem className="w-full flex items-center justify-center">
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
    <SidebarHeader className="relative" onClick={(e) => e.stopPropagation()}>
      <SidebarMenu>
        <SidebarMenuItem
          className={cn('flex items-center justify-start gap-1 pl-2')}
        >
          {state === 'collapsed' ? (
            <SidebarLogoCollapsed linkTo={defaultRoute} />
          ) : (
            <div className="flex items-center gap-2 w-full">
              <SidebarLogoCollapsed linkTo={defaultRoute} />
              <Separator orientation="vertical" className="h-4" />
              <PlatformSwitcher>
                <SidebarMenuButton className="px-2 h-9 gap-3 flex-1 min-w-0">
                  <h1 className="flex-1 min-w-0 truncate font-semibold">
                    {currentPlatform?.name}
                  </h1>
                  <ChevronsUpDown className="ml-auto size-4 shrink-0" />
                </SidebarMenuButton>
              </PlatformSwitcher>
            </div>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
};
