import { isNil } from '@activepieces/core-utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';
import { Suspense, useSyncExternalStore } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Outlet, useMatches } from 'react-router-dom';

import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { useEmbedding } from '@/components/providers/embed-provider';
import { SocketProvider } from '@/components/providers/socket-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { CreditsUsageAlert, ManagePlanDialog } from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { errorReporting } from '@/lib/error-reporting';
import { cn } from '@/lib/utils';

import { AllowOnlyLoggedInUserOnlyGuard } from './allow-logged-in-user-only-guard';
import { ChatContentColumn } from './chat-panel/chat-content-column';
import { ChatNotch } from './chat-panel/chat-notch';
import { ChatChromeHost, ChatDock, ChatWindow } from './chat-panel/chat-window';
import { GlobalSearchProvider } from './global-search/global-search-context';
import { ProjectDashboardLayoutHeader } from './project-layout/project-dashboard-layout-header';
import { AppSidebar } from './sidebar/app-sidebar';

export function AppShellRoute() {
  const handle = useShellHandle();
  if (handle.allowAnonymous && !authenticationSession.isLoggedIn()) {
    return (
      <Suspense fallback={<RouteLoadingBar />}>
        <Outlet />
      </Suspense>
    );
  }
  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      <SocketProvider>
        <AppShell handle={handle} />
      </SocketProvider>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}

export function useShellHandle(): RouteHandle {
  const matches = useMatches();
  const match = matches.findLast((m) => isRouteHandle(m.handle));
  return isRouteHandle(match?.handle) ? match.handle : shellHandles.project;
}

function AppShell({ handle }: { handle: RouteHandle }) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const embedded = useEmbedding().embedState.isEmbedded;
  const projectId = useSyncExternalStore(
    authenticationSession.subscribe,
    readProjectId,
  );
  const isPlatform = handle.shell === 'platform';
  const isBuilder = handle.shell === 'builder';
  const showHeader =
    handle.projectHeader === true && !isNil(projectId) && projectId !== '';

  return (
    <GlobalSearchProvider>
      <div
        className={cn(
          'flex h-full w-full overflow-hidden',
          !embedded && 'max-md:h-svh max-md:flex-col',
        )}
      >
        <AppSidebar mode={isPlatform ? 'platform' : 'app'} />
        <SidebarProvider
          open={false}
          keyboardShortcut={false}
          className={cn(
            'flex-1 min-w-0 w-auto',
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
                id={embedded && isBuilder ? undefined : CARD_ID}
                className={cn(
                  'relative flex h-full overflow-clip',
                  isPlatform ? 'bg-(--admin-page)' : 'bg-gray-1',
                  !embedded && 'rounded-xl shadow-panel border',
                  embedded && isBuilder && 'border-l',
                )}
              >
                {!embedded && <ChatDock side="left" />}
                <ChatContentColumn>
                  {showHeader && (
                    <ProjectDashboardLayoutHeader key={projectId} />
                  )}
                  {handle.shell === 'project' && <CreditsUsageAlert />}
                  <div className={PAGE_CLASS[handle.shell]}>
                    <Suspense fallback={<RouteLoadingBar />}>
                      <Outlet />
                    </Suspense>
                  </div>
                </ChatContentColumn>
                {!embedded && <ChatDock side="right" />}
              </div>
              {!embedded && (
                <>
                  <ChatNotch className="bottom-3" />
                  <ChatWindow />
                </>
              )}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
      {edition !== ApEdition.COMMUNITY && <ManagePlanDialog />}
      {!embedded && (
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
          <ChatChromeHost />
        </ErrorBoundary>
      )}
    </GlobalSearchProvider>
  );
}

function readProjectId(): string | null {
  return authenticationSession.getProjectId();
}

function isRouteHandle(value: unknown): value is RouteHandle {
  return typeof value === 'object' && value !== null && 'shell' in value;
}

const CARD_ID = 'dashboard-content-container';

const PAGE_CLASS: Record<RouteHandle['shell'], string> = {
  project: 'flex-1 overflow-auto',
  builder: 'flex min-h-0 flex-1 flex-col',
  platform: 'flex flex-col flex-1 overflow-auto [scrollbar-gutter:stable]',
};

export type RouteHandle = {
  shell: 'project' | 'builder' | 'platform';
  chat?: 'full';
  projectHeader?: true;
  allowAnonymous?: true;
};

export const shellHandles = {
  project: { shell: 'project' },
  projectWithHeader: { shell: 'project', projectHeader: true },
  publicProject: { shell: 'project', allowAnonymous: true },
  chat: { shell: 'project', chat: 'full' },
  builder: { shell: 'builder' },
  platform: { shell: 'platform' },
} satisfies Record<string, RouteHandle>;
