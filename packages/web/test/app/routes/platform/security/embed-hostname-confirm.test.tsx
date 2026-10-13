/**
 * @vitest-environment jsdom
 */
import { EmbedSubdomain, EmbedSubdomainStatus } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HostnameStep } from '@/app/routes/platform/security/embed/steps/hostname-step';

const state = vi.hoisted(() => ({ upsert: vi.fn() }));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));
vi.mock('@/features/platform-admin', () => ({
  embedSubdomainApi: {
    upsert: (request: unknown) => state.upsert(request),
  },
  embedSubdomainKeys: { current: ['embed-subdomain'] },
}));

const SUBDOMAIN: EmbedSubdomain = {
  id: 'sub',
  created: '2026-01-01T00:00:00.000Z',
  updated: '2026-01-01T00:00:00.000Z',
  platformId: 'p',
  hostname: 'flows.acme.com',
  status: EmbedSubdomainStatus.ACTIVE,
  cloudflareId: 'cf',
  verificationRecords: [],
};

function renderStep() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <HostnameStep subdomain={SUBDOMAIN} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  state.upsert = vi.fn().mockRejectedValue(new Error('Hostname is taken'));
});

afterEach(cleanup);

describe('Embed hostname change', () => {
  it('keeps the confirm open when saving the new domain fails', async () => {
    renderStep();

    fireEvent.change(screen.getByPlaceholderText('flows.acme.com'), {
      target: { value: 'apps.acme.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Update domain' }),
    );

    await waitFor(() => expect(state.upsert).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Update domain' }),
      ).toBeDefined(),
    );
    expect(screen.getByText('Change embed domain?')).toBeDefined();
  });
});
