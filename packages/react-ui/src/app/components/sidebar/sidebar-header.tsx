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

  if (false) {
    return (
      <SidebarHeader
        className="relative w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <SidebarMenu className="w-full">
          <SidebarMenuItem className="flex items-center justify-between gap-1 w-full">
            <div className="flex items-center gap-1 w-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to={defaultRoute}
                    className={cn(
                      'w-full flex items-center justify-center h-9',
                    )}
                  >
                    <Button variant={'ghost'} size={'icon'} className="w-full">
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
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  side={state === 'collapsed' ? 'right' : 'bottom'}
                >
                  {t('Home')}
                </TooltipContent>
              </Tooltip>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
    );
  }

  const logoLink = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link to={defaultRoute}>
          <Button variant={'ghost'} size={'icon'}>
            <img
              src={branding.logos.logoIconUrl}
              alt={t('Home')}
              className="h-5 w-5 object-contain"
            />
          </Button>
        </Link>
      </TooltipTrigger>
      <TooltipContent side={state === 'collapsed' ? 'right' : 'bottom'}>
        {t('Home')}
      </TooltipContent>
    </Tooltip>
  );

  return (
    <SidebarHeader
      className="relative px-0"
      onClick={(e) => e.stopPropagation()}
    >
      <SidebarMenu>
        <SidebarMenuItem className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 w-full">
            {state === 'collapsed' ? (
              <div className="w-full flex items-center justify-center">
                {logoLink}
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full px-2">
                {logoLink}
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
