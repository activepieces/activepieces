/**
 * @vitest-environment jsdom
 */
import { act, cleanup, render, screen } from '@testing-library/react';
import * as React from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppShellRoute } from '@/app/components/app-shell';
import { shellHandles } from '@/lib/shell-handle';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/features/templates', () => ({
  templatesHooks: {
    useTemplate: () => ({ data: undefined, isPending: false }),
  },
}));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: {
    isLoggedIn: () => true,
    subscribe: () => () => undefined,
    getCurrentUserId: () => 'u1',
    getPlatformId: () => 'pl1',
    getProjectId: () => 'p1',
    getToken: () => 'token',
    appendProjectRoutePrefix: (path: string) => `/projects/p1${path}`,
  },
}));

vi.mock('@/app/components/allow-logged-in-user-only-guard', () => ({
  AllowOnlyLoggedInUserOnlyGuard: ({ children }: React.PropsWithChildren) => (
    <>{children}</>
  ),
}));

vi.mock('@/components/providers/socket-provider', () => ({
  SocketProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/app/components/global-search/global-search-context', () => ({
  GlobalSearchProvider: ({ children }: React.PropsWithChildren) => (
    <>{children}</>
  ),
}));

vi.mock('@/app/components/sidebar/app-sidebar', () => ({
  AppSidebar: () => <nav aria-label="App sidebar" />,
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useIsPlatformAdmin: () => true,
}));

vi.mock(
  '@/app/components/project-layout/project-dashboard-layout-header',
  () => ({
    ProjectDashboardLayoutHeader: () => null,
  }),
);

vi.mock('@/components/ui/sidebar-shadcn', () => ({
  SidebarInset: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({ embedState: { isEmbedded: false } }),
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({ platform: { plan: { chatEnabled: true } } }),
  },
}));

vi.mock('@/features/billing', () => ({
  CreditsUsageAlert: () => null,
  ManagePlanDialog: () => null,
  SelfServeTrialDialog: () => null,
  SelfServeTrialEndingAlert: () => null,
}));

vi.mock('@/features/projects', () => ({
  projectCollectionUtils: { useHasAccessToProject: () => true },
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: 'ce' }) },
}));

vi.mock('@/app/components/chat-panel/chat-window', () => ({
  ChatPanel: () => {
    const open = useChatPanel((s) => s.open);
    const mode = useChatPanel((s) => s.mode);
    return (
      <aside aria-label="Chat" data-open={String(open)} data-mode={mode} />
    );
  },
  useChatWidth: () => 'closed',
}));

vi.mock('@/app/components/chat-panel/chat-notch', () => ({
  ChatNotch: () => <button type="button">Chat notch</button>,
}));

vi.mock('@/app/components/chat-panel/chat-content-column', () => ({
  ChatContentColumn: ({ children }: React.PropsWithChildren) => <>{children}</>,
  PageSkeleton: () => null,
}));

vi.mock('@/lib/error-reporting', () => ({
  errorReporting: { report: vi.fn() },
}));

vi.mock('@/hooks/use-session-project-id', () => ({
  useSessionProjectId: () => null,
}));

describe('AppShellRoute chat on admin pages', () => {
  beforeEach(() => {
    useChatPanel.setState({ open: false, mode: 'left' });
  });

  afterEach(cleanup);

  it('renders no chat or notch on an admin route', () => {
    useChatPanel.setState({ open: true, mode: 'right' });
    renderAt({ path: '/platform/projects' });

    expect(screen.getByText('Admin page')).toBeTruthy();
    expect(screen.queryByRole('complementary', { name: 'Chat' })).toBeNull();
    expect(screen.queryByText('Chat notch')).toBeNull();
  });

  it('shows the chat and notch on a project page', () => {
    renderAt({ path: '/flows' });

    expect(screen.getByRole('complementary', { name: 'Chat' })).toBeTruthy();
    expect(screen.getByText('Chat notch')).toBeTruthy();
  });

  it('restores the dock as it was when returning from admin', async () => {
    useChatPanel.setState({ open: true, mode: 'right' });
    const router = renderAt({ path: '/flows' });

    await act(() => router.navigate('/platform/projects'));
    expect(screen.queryByRole('complementary', { name: 'Chat' })).toBeNull();
    expect(screen.queryByText('Chat notch')).toBeNull();

    await act(() => router.navigate('/flows'));
    const chat = screen.getByRole('complementary', { name: 'Chat' });
    expect(chat.getAttribute('data-open')).toBe('true');
    expect(chat.getAttribute('data-mode')).toBe('right');
    expect(useChatPanel.getState().open).toBe(true);
  });
});

function renderAt({ path }: { path: string }) {
  const router = createMemoryRouter(
    [
      {
        element: <AppShellRoute />,
        children: [
          {
            path: '/platform/projects',
            handle: shellHandles.platform,
            element: <p>Admin page</p>,
          },
          {
            path: '/flows',
            handle: shellHandles.project,
            element: <p>Flows page</p>,
          },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return router;
}
