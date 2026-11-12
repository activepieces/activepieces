/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppSidebar } from '@/app/components/sidebar/app-sidebar';

const rail = vi.hoisted(() => ({
  open: false,
  onOpenChange: vi.fn(),
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
  MOBILE_BREAKPOINT: 768,
}));

vi.mock('@/features/workspace/lib/rail-collapsed', () => ({
  useRailOpenState: () => rail,
}));

vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({
    embedState: { isEmbedded: false, hideSideNav: false },
  }),
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { name: 'Acme', plan: { chatEnabled: false } },
    }),
  },
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: {
    useFlag: () => ({ data: 'ce' }),
    useWebsiteBranding: () => ({
      websiteName: 'Activepieces',
      logos: { logoIconUrl: '' },
    }),
  },
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({ checkAccess: () => true }),
}));

vi.mock('@/lib/route-utils', () => ({
  determineDefaultRoute: () => '/automations',
}));

vi.mock('@/features/billing', () => ({
  SidebarUsageLimits: () => null,
  EnterprisePlanIndicator: () => null,
}));

vi.mock('@/features/projects', () => ({
  PlatformSwitcher: () => null,
}));

vi.mock('@/lib/shell-handle', () => ({
  useShellHandle: () => ({ shell: 'platform' }),
  CHAT_ALLOWED: { project: true, builder: true, platform: false },
}));

vi.mock('@/app/components/global-search/global-search-context', () => ({
  useGlobalSearch: () => ({ setOpen: vi.fn() }),
}));

vi.mock('@/app/components/sidebar/app-nav', () => ({
  AppNav: () => null,
  PlatformAdminNavItem: () => null,
}));

vi.mock('@/app/components/sidebar/mobile-sidebar-bar', () => ({
  MobileSidebarBar: () => null,
}));

vi.mock('@/app/components/sidebar/platform', () => ({
  PlatformNav: () => null,
}));

vi.mock('@/app/components/sidebar/sidebar-user', () => ({
  SidebarUser: () => null,
}));

describe('AppSidebar in the admin console', () => {
  afterEach(() => {
    cleanup();
    rail.onOpenChange.mockReset();
  });

  it('opens the collapsed sidebar with the mouse', () => {
    renderSidebar();

    fireEvent.click(screen.getByRole('button', { name: 'Open sidebar' }));

    expect(rail.onOpenChange).toHaveBeenCalledWith(true);
  });

  it('keeps the way back to the app when collapsed', () => {
    renderSidebar();

    expect(screen.getByRole('link', { name: 'Back to app' })).toHaveProperty(
      'pathname',
      '/automations',
    );
  });
});

function renderSidebar() {
  return render(
    <MemoryRouter initialEntries={['/platform/projects']}>
      <AppSidebar mode="platform" />
    </MemoryRouter>,
  );
}
