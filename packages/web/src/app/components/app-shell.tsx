import { isNil } from '@activepieces/core-utils';
import { ApEdition, ApFlagId, TemplateType } from '@activepieces/shared';
import { Suspense, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Navigate, Outlet, useMatches } from 'react-router-dom';

import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { useEmbedding } from '@/components/providers/embed-provider';
import { SocketProvider } from '@/components/providers/socket-provider';
import { SidebarInset } from '@/components/ui/sidebar-shadcn';
import { CreditsUsageAlert, ManagePlanDialog } from '@/features/billing';
import { projectCollectionUtils } from '@/features/projects';
import { templatesHooks } from '@/features/templates';
import { useChatOn } from '@/features/workspace/lib/use-chat-on';
import { flagsHooks } from '@/hooks/flags-hooks';
import { useSessionProjectId } from '@/hooks/use-session-project-id';
import { authenticationSession } from '@/lib/authentication-session';
import { errorReporting } from '@/lib/error-reporting';
import { cn } from '@/lib/utils';

import { AllowOnlyLoggedInUserOnlyGuard } from './allow-logged-in-user-only-guard';
import { ChatContentColumn } from './chat-panel/chat-content-column';
import { ChatLauncher, ChatPanel } from './chat-panel/chat-window';
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
        {variant === 'loading' ? (
          <RouteLoadingBar />
        ) : variant === 'bare' ? (
          <BarePage />
        ) : (
          <AppShell handle={handle} />
        )}
      </SocketProvider>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}

export function useShellHandle(): RouteHandle {
  return useShellMatch().handle;
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
}): ShellVariant | 'loading' {
  const { data: template, isPending } = templatesHooks.useTemplate(templateId);
  const [settled, setSettled] = useState<ShellVariant | null>(null);
  const variant: ShellVariant | null = isNil(templateId)
    ? 'shell'
    : isPending
    ? null
    : template?.type === TemplateType.SHARED
    ? 'bare'
    : 'shell';
  if (variant !== null && variant !== settled) {
    setSettled(variant);
  }
  return variant ?? settled ?? 'loading';
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
  const chatOn = useChatOn();
  const projectId = useSessionProjectId();
  const isPlatform = handle.shell === 'platform';
  const isBuilder = handle.shell === 'builder';
  const headerProjectId =
    handle.projectHeader === true && !isNil(projectId) && projectId !== ''
      ? projectId
      : null;

  if (handle.chat === 'full' && !chatOn) {
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
                !embedded &&
                  (isBuilder
                    ? 'p-1.5'
                    : 'pr-2 pt-3 pb-3 max-md:pl-2 max-md:pt-2'),
              )}
            >
              <div
                className={cn(
                  'relative flex h-full overflow-clip',
                  isPlatform ? 'bg-(--admin-page)' : 'bg-gray-1',
                  !embedded && 'rounded-xl shadow-panel border',
                  embedded && isBuilder && 'border-l',
                )}
              >
                {chatOn && (
                  <ErrorBoundary
                    fallback={null}
                    onError={(error, info) =>
                      errorReporting.report({
                        error,
                        componentStack: info.componentStack,
                        source: 'react-error-boundary',
                      })
                    }
                  >
                    <ChatPanel />
                  </ErrorBoundary>
                )}
                <ChatContentColumn>
                  {!isNil(headerProjectId) && (
                    <ProjectHeader projectId={headerProjectId} />
                  )}
                  {handle.shell === 'project' && <CreditsUsageAlert />}
                  <div className={PAGE_CLASS[handle.shell]}>
                    <Suspense fallback={<RouteLoadingBar />}>
                      <Outlet />
                    </Suspense>
                  </div>
                </ChatContentColumn>
                {chatOn && <ChatLauncher />}
              </div>
            </div>
          </SidebarInset>
        </div>
      </div>
      {edition !== ApEdition.COMMUNITY && <ManagePlanDialog />}
    </GlobalSearchProvider>
  );
}

function ProjectHeader({ projectId }: { projectId: string }) {
  const hasAccess = projectCollectionUtils.useHasAccessToProject(projectId);
  return hasAccess ? <ProjectDashboardLayoutHeader key={projectId} /> : null;
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
  chat?: 'full';
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
  chat: { shell: 'project', chat: 'full' },
  builder: { shell: 'builder' },
  platform: { shell: 'platform' },
} satisfies Record<string, RouteHandle>;
