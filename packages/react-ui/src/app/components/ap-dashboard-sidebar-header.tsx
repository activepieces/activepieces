import { t } from 'i18next';
import { Link } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import { SidebarHeader } from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ProjectSwitcher } from '@/features/projects/components/project-switcher';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn, determineDefaultRoute } from '@/lib/utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';

import ProjectSettingsDropdownMenu from './project-settings-dropdown-menu';

const ApDashboardSidebarHeader = ({
  isHomeDashboard,
}: {
  isHomeDashboard: boolean;
}) => {
  const branding = flagsHooks.useWebsiteBranding();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { embedState } = useEmbedding();
  const isInPlatformAdmin = window.location.pathname.includes('platform');
  const showProjectSwitcher =
    edition !== ApEdition.COMMUNITY &&
    !embedState.isEmbedded &&
    !isInPlatformAdmin;
  const { checkAccess } = useAuthorization();
  const defaultRoute = determineDefaultRoute(checkAccess);

  return (
    <SidebarHeader className="pb-0">
      <div
        className={cn('flex items-center justify-between grow gap-1', {
          'justify-start': !isHomeDashboard,
          'justify-center': embedState.hideProjectSettings,
        })}
      >
        <Button
          variant="ghost"
          className={cn({ 'w-full': !isHomeDashboard && !showProjectSwitcher })}
        >
          <Link to={isHomeDashboard ? defaultRoute : '/platform'}>
            <Tooltip>
              <TooltipTrigger asChild>
                <>
                  {showProjectSwitcher && (
                    <img
                      src={branding.logos.logoIconUrl}
                      alt={t('home')}
                      className="h-5 w-5 object-contain"
                    />
                  )}

                  {!showProjectSwitcher && (
                    <img
                      src={branding.logos.fullLogoUrl}
                      alt={t('home')}
                      width={160}
                      height={51}
                      className="max-h-[51px] max-w-[160px] object-contain"
                    />
                  )}
                </>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('Home')}</TooltipContent>
            </Tooltip>
          </Link>
        </Button>

        {showProjectSwitcher && (
          <div className="grow">
            <ProjectSwitcher />
          </div>
        )}

        {isHomeDashboard && !embedState.hideProjectSettings && (
          <ProjectSettingsDropdownMenu />
        )}
      </div>
    </SidebarHeader>
  );
};

ApDashboardSidebarHeader.displayName = 'ApDashboardSidebarHeader';

export { ApDashboardSidebarHeader };
