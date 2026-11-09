import { isNil } from '@activepieces/core-utils';
import { ApEdition, ApFlagId, TemplateType } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { Suspense, useEffect, useRef } from 'react';
import { Navigate, Outlet, useMatches } from 'react-router-dom';

import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { useEmbedding } from '@/components/providers/embed-provider';
import { SocketProvider } from '@/components/providers/socket-provider';
import { SidebarInset } from '@/components/ui/sidebar-shadcn';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CreditsUsageAlert, ManagePlanDialog } from '@/features/billing';
import { projectCollectionUtils } from '@/features/projects';
import { templatesApi } from '@/features/templates';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { useSessionProjectId } from '@/hooks/use-session-project-id';
import { authenticationSession } from '@/lib/authentication-session';
import { pageColumnUtils } from '@/lib/page-column-utils';
import { cn } from '@/lib/utils';

import { AllowOnlyLoggedInUserOnlyGuard } from './allow-logged-in-user-only-guard';
import { GlobalSearchProvider } from './global-search/global-search-context';
import { ProjectDashboardLayoutHeader } from './project-layout/project-dashboard-layout-header';
import { AppSidebar } from './sidebar/app-sidebar';

export function AppShellRoute() {
  const { handle, templateId } = useShellMatch();
  const loggedIn = authenticationSession.isLoggedIn();
  const variant = useShellVariant({
    templateId: loggedIn ? templateId : undefined,
  });
  if (handle.allowAnonymous && !loggedIn) {
    return <BarePage />;
  }
  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      <SocketProvider>
        {variant === 'bare' ? <BarePage /> : <AppShell handle={handle} />}
      </SocketProvider>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}

function useShellMatch(): { handle: RouteHandle; templateId?: string } {
  const matches = useMatches();
  const match = matches.findLast((m) => isRouteHandle(m.handle));
  const handle: RouteHandle = isRouteHandle(match?.handle)
    ? match.handle
    : shellHandles.project;
  return {
    handle,
    templateId:
      handle.standalone === 'sharedTemplate'
        ? match?.params.templateId
        : undefined,
  };
}

function useShellVariant({
  templateId,
}: {
  templateId: string | undefined;
}): ShellVariant {
  const { data: template, isLoading } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => templatesApi.getTemplate(templateId ?? ''),
    enabled: !isNil(templateId),
  });
  const lastVariant = useRef<ShellVariant>('bare');
  const variant: ShellVariant = isNil(templateId)
    ? 'shell'
    : isLoading
    ? lastVariant.current
    : template?.type === TemplateType.SHARED
    ? 'bare'
    : 'shell';
  useEffect(() => {
    lastVariant.current = variant;
  }, [variant]);
  return variant;
}

function BarePage() {
  return (
    <Suspense fallback={<RouteLoadingBar />}>
      <Outlet />
    </Suspense>
  );
}

function AppShell({ handle }: { handle: RouteHandle }) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const embedded = useEmbedding().embedState.isEmbedded;
  const projectId = useSessionProjectId();
  const isPlatformAdmin = useIsPlatformAdmin();
  const isPlatform = handle.shell === 'platform';
  const isBuilder = handle.shell === 'builder';
  const headerProjectId =
    handle.projectHeader === true && !isNil(projectId) && projectId !== ''
      ? projectId
      : null;

  if (isPlatform && !isPlatformAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <GlobalSearchProvider>
      <div
        className={cn(
          'flex h-full w-full overflow-hidden',
          !embedded && 'max-md:h-svh max-md:flex-col',
        )}
      >
        <AppSidebar mode={isPlatform ? 'platform' : 'app'} />
        <TooltipProvider delayDuration={0}>
          <div
            className={cn(
              'flex h-svh flex-1 min-w-0',
              !isPlatform && 'will-change-transform',
              !embedded && 'max-md:h-auto max-md:min-h-0',
            )}
          >
            <SidebarInset className="flex flex-col h-full overflow-hidden bg-gray-2">
              <div
                className={cn(
                  'relative flex-1 flex flex-col overflow-hidden',
                  !embedded && 'pr-2 pt-3 pb-3 max-md:pl-2 max-md:pt-2',
                )}
              >
                <div
                  id={pageColumnUtils.ID}
                  className={cn(
                    'relative flex flex-col h-full overflow-clip',
                    isPlatform ? 'bg-(--admin-page)' : 'bg-gray-1',
                    !embedded && 'rounded-xl shadow-panel border',
                    embedded && isBuilder && 'border-l',
                  )}
                >
                  {!isNil(headerProjectId) && (
                    <ProjectHeader projectId={headerProjectId} />
                  )}
                  {handle.shell === 'project' && <CreditsUsageAlert />}
                  <div className={PAGE_CLASS[handle.shell]}>
                    <Suspense fallback={<RouteLoadingBar />}>
                      <Outlet />
                    </Suspense>
                  </div>
                </div>
              </div>
            </SidebarInset>
          </div>
        </TooltipProvider>
      </div>
      {edition !== ApEdition.COMMUNITY && <ManagePlanDialog />}
    </GlobalSearchProvider>
  );
}

function ProjectHeader({ projectId }: { projectId: string }) {
  const hasAccess = projectCollectionUtils.useHasAccessToProject(projectId);
  return hasAccess ? <ProjectDashboardLayoutHeader /> : null;
}

function isRouteHandle(value: unknown): value is RouteHandle {
  return typeof value === 'object' && value !== null && 'shell' in value;
}

const PAGE_CLASS: Record<RouteHandle['shell'], string> = {
  project: 'flex-1 overflow-auto',
  builder: 'flex min-h-0 flex-1 flex-col',
  platform: 'flex flex-col flex-1 overflow-auto [scrollbar-gutter:stable]',
};

type ShellVariant = 'shell' | 'bare';

export type RouteHandle = {
  shell: 'project' | 'builder' | 'platform';
  projectHeader?: true;
  allowAnonymous?: true;
  standalone?: 'sharedTemplate';
};

export const shellHandles = {
  project: { shell: 'project' },
  projectWithHeader: { shell: 'project', projectHeader: true },
  publicProject: { shell: 'project', allowAnonymous: true },
  templateDetails: {
    shell: 'project',
    allowAnonymous: true,
    standalone: 'sharedTemplate',
  },
  builder: { shell: 'builder' },
  platform: { shell: 'platform' },
} satisfies Record<string, RouteHandle>;
