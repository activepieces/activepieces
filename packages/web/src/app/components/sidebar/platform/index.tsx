import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { Fragment, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

import { adminPagesUtils } from '@/app/routes/platform/admin-pages';
import {
  ChevronLeftIcon,
  ChevronLeftIconHandle,
} from '@/components/icons/chevron-left';
import { buttonVariants } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar-shadcn';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { determineDefaultRoute } from '@/lib/route-utils';
import { cn } from '@/lib/utils';

import { SidebarUser } from '../sidebar-user';

import { PlatformNavItem, PlatformNavSubItem } from './platform-nav-item';

export function PlatformSidebar() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { checkAccess } = useAuthorization();
  const defaultRoute = determineDefaultRoute({
    checkAccess,
    chatEnabled: platform.plan.chatEnabled,
  });
  const chevronRef = useRef<ChevronLeftIconHandle>(null);

  const location = useLocation();
  const context = { plan: platform.plan, edition };
  const groups = adminPagesUtils.navGroups(context);
  const activeId = adminPagesUtils.activePageId(location.pathname);
  const [searchParams] = useSearchParams();
  const requestedTabId = searchParams.get('tab');

  return (
    <Sidebar className="border-r-0!">
      <SidebarHeader className="pb-0">
        <Link
          to={defaultRoute}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'w-full justify-start gap-2 px-2',
          )}
          onMouseEnter={() => chevronRef.current?.startAnimation()}
          onMouseLeave={() => chevronRef.current?.stopAnimation()}
        >
          <ChevronLeftIcon ref={chevronRef} className="size-4" size={16} />
          <span className="truncate text-sm">{t('Back to app')}</span>
        </Link>
      </SidebarHeader>
      <div className="flex-1 overflow-y-auto">
        <SidebarContent className="gap-0">
          {groups.map((group) => (
            <SidebarGroup key={group.group} className="cursor-default shrink-0">
              <SidebarGroupLabel className="px-2 text-xss font-semibold uppercase tracking-wider text-muted-foreground">
                {t(group.label)}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.pages.map((page) => {
                    const tabs = adminPagesUtils.navTabs(page, context);
                    const isActivePage = page.id === activeId;
                    const activeTabId = adminPagesUtils.activeTabId(
                      page,
                      context,
                      requestedTabId,
                    );
                    return (
                      <Fragment key={page.id}>
                        <PlatformNavItem
                          to={page.path}
                          label={t(page.nav.label)}
                          icon={page.nav.icon}
                          active={
                            isActivePage &&
                            !tabs.some((tab) => tab.id === activeTabId)
                          }
                          crowned={adminPagesUtils.isCrowned(page, context)}
                        />
                        {tabs.map((tab) => (
                          <PlatformNavSubItem
                            key={tab.id}
                            to={`${page.path}?tab=${tab.id}`}
                            label={t(tab.label)}
                            active={isActivePage && activeTabId === tab.id}
                            crowned={tab.isLocked?.(context) === true}
                          />
                        ))}
                      </Fragment>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </div>

      <SidebarFooter className="pb-3">
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
