/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { platformRoutes } from '@/app/routes/platform-routes';

const plan = vi.hoisted(() => ({ aiProvidersEnabled: false }));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({ platform: { plan } }),
  },
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: {
    useFlag: () => ({ data: 'cloud' }),
  },
}));

vi.mock('@/features/billing', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useManagePlanDialogStore: () => ({ openDialog: vi.fn() }),
}));

vi.mock('@/app/components/platform-layout', () => ({
  PlatformLayout: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/app/components/page-title', () => ({
  PageTitle: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/app/routes/platform/setup/ai', () => ({
  default: () => <h1>AI Center providers</h1>,
}));

function renderAiCenterRoute() {
  const route = platformRoutes.find(({ path }) => path === '/platform/ai');
  render(
    <MemoryRouter initialEntries={['/platform/ai']}>
      {route?.element}
    </MemoryRouter>,
  );
}

describe('/platform/ai route', () => {
  it('shows the plan lock when the plan lacks aiProvidersEnabled', async () => {
    plan.aiProvidersEnabled = false;

    renderAiCenterRoute();

    expect(
      await screen.findAllByRole('heading', { name: 'Unlock AI providers' }),
    ).toEqual([expect.any(HTMLHeadingElement)]);
    expect(
      screen.queryAllByRole('heading', { name: 'AI Center providers' }),
    ).toEqual([]);
  });

  it('opens the providers page when aiProvidersEnabled is on', async () => {
    plan.aiProvidersEnabled = true;

    renderAiCenterRoute();

    expect(
      await screen.findAllByRole('heading', { name: 'AI Center providers' }),
    ).toEqual([expect.any(HTMLHeadingElement)]);
    expect(
      screen.queryAllByRole('heading', { name: 'Unlock AI providers' }),
    ).toEqual([]);
  });
});
