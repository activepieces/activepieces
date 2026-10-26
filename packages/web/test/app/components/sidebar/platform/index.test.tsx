/**
 * @vitest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { PlatformNav } from '@/app/components/sidebar/platform';

const plan = vi.hoisted(() => ({
  aiProvidersEnabled: false,
  workerGroupsEnabled: false,
}));
const flags = vi.hoisted(() => ({ edition: 'cloud' }));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({ platform: { plan } }),
  },
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: {
    useFlag: () => ({ data: flags.edition }),
  },
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({ checkAccess: () => true }),
}));

vi.mock('@/lib/route-utils', () => ({
  determineDefaultRoute: () => '/',
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/components/ui/sidebar-shadcn', () => {
  const Passthrough = ({ children }: React.PropsWithChildren) => (
    <>{children}</>
  );
  return {
    Sidebar: Passthrough,
    SidebarContent: Passthrough,
    SidebarFooter: Passthrough,
    SidebarMenu: Passthrough,
    SidebarHeader: Passthrough,
    SidebarGroup: Passthrough,
    SidebarGroupContent: Passthrough,
    SidebarGroupLabel: Passthrough,
  };
});

vi.mock('@/app/components/sidebar/sidebar-user', () => ({
  SidebarUser: () => null,
}));

vi.mock('@/app/components/sidebar/ap-sidebar-item', () => ({
  ApSidebarItem: ({
    label,
    subItems,
  }: {
    label: string;
    subItems?: { label: string; locked?: boolean }[];
  }) => (
    <ul aria-label={label}>
      {(subItems ?? []).map((subItem) => (
        <li
          key={subItem.label}
          aria-label={
            subItem.locked ? `${subItem.label} locked` : subItem.label
          }
        />
      ))}
    </ul>
  ),
}));

function renderSidebar() {
  render(
    <MemoryRouter>
      <PlatformNav />
    </MemoryRouter>,
  );
}

describe('platform sidebar AI Center', () => {
  it('leaves Providers unlocked when aiProvidersEnabled is on', () => {
    plan.aiProvidersEnabled = true;

    renderSidebar();

    expect(screen.queryAllByRole('listitem', { name: 'Providers' })).toEqual([
      expect.any(HTMLLIElement),
    ]);
    expect(
      screen.queryAllByRole('listitem', { name: 'Providers locked' }),
    ).toEqual([]);
  });
});

describe('platform sidebar Workers', () => {
  it('has no sub-items on cloud, even when workerGroupsEnabled is on', () => {
    flags.edition = 'cloud';
    plan.workerGroupsEnabled = true;

    renderSidebar();

    expect(
      within(screen.getByRole('list', { name: 'Workers' })).queryAllByRole(
        'listitem',
      ),
    ).toEqual([]);
  });

  it('locks Worker groups on self-hosted when workerGroupsEnabled is off', () => {
    flags.edition = 'ee';
    plan.workerGroupsEnabled = false;

    renderSidebar();

    expect(
      screen.queryAllByRole('listitem', { name: 'Worker groups locked' }),
    ).toEqual([expect.any(HTMLLIElement)]);
  });

  it('unlocks Worker groups on self-hosted when workerGroupsEnabled is on', () => {
    flags.edition = 'ee';
    plan.workerGroupsEnabled = true;

    renderSidebar();

    expect(
      screen.queryAllByRole('listitem', { name: 'Worker groups' }),
    ).toEqual([expect.any(HTMLLIElement)]);
  });
});
