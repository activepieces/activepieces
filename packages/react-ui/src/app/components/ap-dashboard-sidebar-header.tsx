import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { Link } from 'react-router-dom';

import { SidebarInviteUserButton } from './sidebar-invite-user';

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
import { useTheme } from '@/components/theme-provider';

const ApDashboardSidebarHeader = ({
  isHomeDashboard,
}: {
  isHomeDashboard: boolean;
}) => {
  const branding = flagsHooks.useWebsiteBranding();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { embedState } = useEmbedding();
  const { theme } = useTheme();
  const showProjectSwitcher =
    edition !== ApEdition.COMMUNITY && !embedState.isEmbedded;
  const defaultRoute = determineDefaultRoute(useAuthorization().checkAccess);

  return (
    <SidebarHeader className="pb-0 ">
      <div
        className={cn('flex items-center justify-between pr-1', {
          'justify-center': false,
        })}
      >
        <div className="flex items-center justify-center gap-1">
          <div className="relative">
            <Button variant="ghost">
              <Link
                to={isHomeDashboard ? defaultRoute : '/platform'}
                className="flex items-center justify-center"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h1 className={`text-xl font-semibold ${theme === 'light' ? 'text-gray-900' : ''}`}>{branding.websiteName}</h1>
                    {/* {showProjectSwitcher ? (
                      <img
                        src={branding.logos.logoIconUrl}
                        alt={t('home')}
                        width={28}
                        height={28}
                        className=" max-h-[28px] max-w-[28px] object-contain"
                      />
                    ) : (
                      <img
                        src={branding.logos.fullLogoUrl}
                        alt={t('home')}
                        width={160}
                        height={51}
                        className="max-h-[51px] max-w-[160px] object-contain"
                      />
                    )} */}
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{t('Home')}</TooltipContent>
                </Tooltip>
              </Link>
            </Button>
            {/* {!showProjectSwitcher && (
              <div className="absolute -right-7 top-1">
                <SidebarInviteUserButton />
              </div>
            )} */}
          </div>

          {showProjectSwitcher && (
            <div className="grow">
              <ProjectSwitcher />
            </div>
          )}
        </div>

        {showProjectSwitcher && <SidebarInviteUserButton />}
      </div>
    </SidebarHeader>
  );
};

ApDashboardSidebarHeader.displayName = 'ApDashboardSidebarHeader';

export { ApDashboardSidebarHeader };
