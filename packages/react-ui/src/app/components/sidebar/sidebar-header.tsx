import { t } from 'i18next';
import { ChevronsUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  SidebarHeader,
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
import { PlatformSwitcher } from '@/features/projects/components/platform-switcher';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn, determineDefaultRoute } from '@/lib/utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';

export const AppSidebarHeader = () => {
  const { embedState } = useEmbedding();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const branding = flagsHooks.useWebsiteBranding();
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
          <SidebarMenuItem className="flex items-center justify-between gap-1 w-full">
            <div className="flex items-center gap-1 w-full">
              {/* The following outer div prevents pointer events, so it's not clickable */}
              <div
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'icon' }),
                  'w-full flex items-center justify-center h-9 select-none cursor-default',
                )}
                style={{ pointerEvents: 'none' }}
              >
                <img
                  src={
                    state === 'collapsed'
                      ? branding.logos.logoIconUrl
                      : branding.logos.fullLogoUrl
                  }
                  alt={t('home')}
                  className={cn(
                    'object-contain',
                    state === 'collapsed' ? 'h-5 w-5' : 'w-full h-9',
                  )}
                  draggable={false}
                />
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
    );
  }

  return (
    <SidebarHeader className="relative" onClick={(e) => e.stopPropagation()}>
      <SidebarMenu>
        <SidebarMenuItem className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 w-full">
            {state === 'collapsed' ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <PlatformSwitcher>
                      <Button variant="ghost" size="icon">
                        <img
                          src={branding.logos.logoIconUrl}
                          alt={t('home')}
                          className="h-5 w-5 object-contain"
                        />
                      </Button>
                    </PlatformSwitcher>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {t('Switch Platform')}
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-2 w-full px-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to={defaultRoute}
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'icon' }),
                      )}
                    >
                      <img
                        src={branding.logos.logoIconUrl}
                        alt={t('Home')}
                        className="h-5 w-5 object-contain"
                      />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{t('Home')}</TooltipContent>
                </Tooltip>
                <Separator orientation="vertical" className="h-4" />
                <PlatformSwitcher>
                  <SidebarMenuButton className="px-2 h-9 gap-3 flex-1 min-w-0">
                    <h1 className="flex-1 min-w-0 truncate font-semibold">
                      {currentPlatform?.name}
                    </h1>
                    <ChevronsUpDown className="ml-auto shrink-0" />
                  </SidebarMenuButton>
                </PlatformSwitcher>
              </div>
            )}
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
};
