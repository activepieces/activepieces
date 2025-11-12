import { t } from 'i18next';
import { Link } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { buttonVariants } from '@/components/ui/button';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import { PlatformSwitcher } from '@/features/projects/components/platform-switcher';
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
  const { state } = useSidebar();

  return (
    <SidebarHeader className="relative" onClick={(e) => e.stopPropagation()}>
      <SidebarMenu>
        <SidebarMenuItem className="flex items-center justify-between gap-1">
          <div
            className={cn(
              'flex items-center gap-1',
              state === 'collapsed' ? 'flex-col' : 'flex-row',
            )}
          >
            {state === 'collapsed' && (
              <SidebarTrigger
                iconClassName="size-5"
                className="hidden group-hover/sidebar-hover:flex group-hover/sidebar-hover:opacity-100 p-4"
              />
            )}
            <Link
              to={defaultRoute}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                state === 'collapsed' && 'group-hover/sidebar-hover:!hidden',
              )}
            >
              <img
                src={branding.logos.logoIconUrl}
                alt={t('home')}
                className="h-5 w-5 object-contain"
              />
            </Link>
            {showSwitcher && <PlatformSwitcher />}
          </div>
          {state === 'expanded' && <SidebarTrigger />}
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
};
