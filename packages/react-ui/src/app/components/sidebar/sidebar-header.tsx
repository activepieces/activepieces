import { t } from 'i18next';
import { Link } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { buttonVariants } from '@/components/ui/button';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar-shadcn';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { ProjectSwitcher } from '@/features/projects/components/project-switcher';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
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

  return (
    <SidebarHeader>
      <SidebarMenu>
        {showSwitcher ? (
          <SidebarMenuItem className="flex items-center justify-center gap-1">
            <Link
              to={defaultRoute}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
            >
              <img
                src={branding.logos.logoIconUrl}
                alt={t('home')}
                className="h-5 w-5 object-contain"
              />
            </Link>
            <ProjectSwitcher />
          </SidebarMenuItem>
        ) : (
          <Link
            to={defaultRoute}
            className={cn(buttonVariants({ variant: 'ghost' }))}
          >
            <img
              src={branding.logos.fullLogoUrl}
              alt={t('home')}
              className="object-contain w-40"
            />
          </Link>
        )}
      </SidebarMenu>
      <div className="px-2 py-1">
        <WorkspaceSwitcher />
      </div>
    </SidebarHeader>
  );
};
