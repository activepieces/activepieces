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
  const showSwitcher =
    edition !== ApEdition.COMMUNITY && !embedState.isEmbedded;
  const { checkAccess } = useAuthorization();
  const defaultRoute = determineDefaultRoute(checkAccess);
  const { state } = useSidebar();
  const { platform: currentPlatform } = platformHooks.useCurrentPlatform();

  return (
    <SidebarHeader className="relative" onClick={(e) => e.stopPropagation()}>
      <SidebarMenu>
        <SidebarMenuItem className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            {showSwitcher ? (
              state === 'collapsed' ? (
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
                    {t('Switch Account')}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <PlatformSwitcher>
                  <SidebarMenuButton className="px-2 h-9 gap-3">
                    <img
                      src={branding.logos.logoIconUrl}
                      alt={t('home')}
                      className="h-5 w-5 object-contain"
                    />
                    <Separator orientation="vertical" className="h-4" />
                    <h1 className="flex-1 min-w-0 w-48 truncate font-semibold">
                      {currentPlatform?.name}
                    </h1>
                    <ChevronsUpDown className="ml-auto shrink-0" />
                  </SidebarMenuButton>
                </PlatformSwitcher>
              )
            ) : (
              <Link
                to={defaultRoute}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'icon' }),
                )}
              >
                <img
                  src={branding.logos.logoIconUrl}
                  alt={t('home')}
                  className="h-5 w-5 object-contain"
                />
              </Link>
            )}
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
};
