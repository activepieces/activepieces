// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppShellRoute } from '@/app/components/app-shell';
import { layoutMove } from '@/features/workspace/lib/layout-move';
import { shellHandles } from '@/lib/shell-handle';

const passThrough = vi.hoisted(
  () =>
    ({ children }: { children: ReactNode }) =>
      children,
);

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/app/components/chat-panel/chat-window', () => ({
  ChatPanel: () => null,
  useChatWidth: () => 'closed',
}));
vi.mock('@/app/components/allow-logged-in-user-only-guard', () => ({
  AllowOnlyLoggedInUserOnlyGuard: passThrough,
}));
vi.mock('@/components/providers/socket-provider', () => ({
  SocketProvider: passThrough,
}));
vi.mock('@/app/components/global-search/global-search-context', () => ({
  GlobalSearchProvider: passThrough,
}));
vi.mock('@/app/components/sidebar/app-sidebar', () => ({
  AppSidebar: () => null,
}));
vi.mock('@/app/components/chat-panel/chat-content-column', () => ({
  ChatContentColumn: passThrough,
  PageSkeleton: () => null,
}));
vi.mock('@/app/components/chat-panel/chat-notch', () => ({
  ChatNotch: () => null,
}));
vi.mock(
  '@/app/components/project-layout/project-dashboard-layout-header',
  () => ({
    ProjectDashboardLayoutHeader: () => null,
  }),
);
vi.mock('@/components/ui/sidebar-shadcn', () => ({
  SidebarInset: passThrough,
}));
vi.mock('@/features/billing', () => ({
  CreditsUsageAlert: () => null,
  ManagePlanDialog: () => null,
  SelfServeTrialDialog: () => null,
  SelfServeTrialEndingAlert: () => null,
}));
vi.mock('@/features/templates', () => ({
  templatesHooks: {
    useTemplate: () => ({ data: undefined, isPending: false }),
  },
}));
vi.mock('@/features/workspace/lib/use-chat-on', () => ({
  useChatOn: () => false,
}));
vi.mock('@/hooks/authorization-hooks', () => ({
  useIsPlatformAdmin: () => true,
}));
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: 'ce' }) },
}));
vi.mock('@/hooks/use-session-project-id', () => ({
  useSessionProjectId: () => null,
}));
vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({ embedState: { isEmbedded: false } }),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AppShell', () => {
  it('watches key presses on admin pages, where the chat is off', () => {
    const watch = vi.spyOn(layoutMove, 'watchKeyPresses');
    const router = createMemoryRouter(
      [
        {
          path: '/platform',
          element: <AppShellRoute />,
          handle: shellHandles.platform,
          children: [{ index: true, element: <p>Admin</p> }],
        },
      ],
      { initialEntries: ['/platform'] },
    );

    render(<RouterProvider router={router} />);

    expect(watch).toHaveBeenCalled();
  });
});
