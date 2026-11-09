/**
 * @vitest-environment jsdom
 */
import { TemplateType } from '@activepieces/shared';
import { act, cleanup, render, screen } from '@testing-library/react';
import * as React from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppShellRoute, shellHandles } from '@/app/components/app-shell';

const template = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const store = {
    query: { data: undefined, isPending: true } as TemplateQuery,
    set: (query: TemplateQuery) => {
      store.query = query;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return store;
});
const pageRenders = vi.hoisted(() => ({ count: 0 }));
const chat = vi.hoisted(() => ({ on: false }));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/features/templates', () => ({
  templatesHooks: {
    useTemplate: () =>
      React.useSyncExternalStore(template.subscribe, () => template.query),
  },
}));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { isLoggedIn: () => true },
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

vi.mock('@/features/billing', () => ({
  CreditsUsageAlert: () => null,
  ManagePlanDialog: () => null,
}));

vi.mock('@/features/projects', () => ({
  projectCollectionUtils: { useHasAccessToProject: () => true },
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: 'ce' }) },
}));

vi.mock('@/features/workspace/lib/use-chat-on', () => ({
  useChatOn: () => chat.on,
}));

vi.mock('@/app/components/chat-panel/chat-window', () => ({
  ChatPanel: () => <aside aria-label="Chat" />,
  ChatSheetLauncher: () => null,
  useChatWidth: () => 'full',
}));

vi.mock('@/app/components/chat-panel/chat-notch', () => ({
  ChatNotch: () => null,
}));

vi.mock('@/app/components/chat-panel/chat-content-column', () => ({
  ChatContentColumn: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/hooks/use-session-project-id', () => ({
  useSessionProjectId: () => null,
}));

describe('AppShellRoute on a template link', () => {
  beforeEach(() => {
    pageRenders.count = 0;
    template.set({ data: undefined, isPending: true });
  });

  afterEach(cleanup);

  it('waits for the template before showing anything', () => {
    renderAt('/templates/t1');

    expect(screen.queryByText('Template page')).toBeNull();
    expect(
      screen.queryByRole('navigation', { name: 'App sidebar' }),
    ).toBeNull();
  });

  it('shows a shared template without the app shell, mounting the page once', () => {
    renderAt('/templates/t1');
    act(() =>
      template.set({ data: { type: TemplateType.SHARED }, isPending: false }),
    );

    expect(screen.getByText('Template page')).toBeTruthy();
    expect(
      screen.queryByRole('navigation', { name: 'App sidebar' }),
    ).toBeNull();
    expect(pageRenders.count).toBe(1);
  });

  it('shows a platform template inside the app shell, mounting the page once', () => {
    renderAt('/templates/t1');
    act(() =>
      template.set({ data: { type: TemplateType.CUSTOM }, isPending: false }),
    );

    expect(screen.getByText('Template page')).toBeTruthy();
    expect(
      screen.getByRole('navigation', { name: 'App sidebar' }),
    ).toBeTruthy();
    expect(pageRenders.count).toBe(1);
  });
});

describe('AppShellRoute on the chat page', () => {
  afterEach(cleanup);

  it('shows the chat when it is on', () => {
    chat.on = true;
    renderAt('/chat');

    expect(screen.getByRole('complementary', { name: 'Chat' })).toBeTruthy();
  });

  it('leaves the chat page when the chat is off or hidden', () => {
    chat.on = false;
    renderAt('/chat');

    expect(screen.getByText('Home')).toBeTruthy();
  });
});

function TemplatePage() {
  React.useEffect(() => {
    pageRenders.count += 1;
  }, []);
  return <p>Template page</p>;
}

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        element: <AppShellRoute />,
        children: [
          {
            path: '/templates/:templateId',
            handle: shellHandles.templateDetails,
            element: <TemplatePage />,
          },
          { path: '/chat', handle: shellHandles.chat, element: null },
          { path: '/', handle: shellHandles.project, element: <p>Home</p> },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

type TemplateQuery = { data: { type: string } | undefined; isPending: boolean };
