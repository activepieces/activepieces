/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-enabled-disabled, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import { EmbedSubdomain, EmbedSubdomainStatus } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HostnameStep } from '@/app/routes/platform/security/embed/steps/hostname-step';
import { mutationFeedback } from '@/lib/mutation-feedback';

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
  state.upsert = vi
    .fn()
    .mockRejectedValue(mutationFeedback.userError('Hostname is taken'));
});

describe('Embed hostname change', () => {
  it('keeps the confirm open and shows why saving the new domain failed', async () => {
    renderStep();

    fireEvent.change(screen.getByPlaceholderText('flows.acme.com'), {
      target: { value: 'apps.acme.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Update domain' }),
    );

    await waitFor(() => expect(state.upsert).toHaveBeenCalledTimes(1));
    const confirm = screen.getByRole('dialog', {
      name: 'Change embed domain?',
      hidden: true,
    });
    await waitFor(() =>
      expect(within(confirm).getByText('Hostname is taken')).toBeDefined(),
    );
    expect(screen.getAllByText('Hostname is taken')).toHaveLength(1);
    expect(toast.error).not.toHaveBeenCalled();
  });
});
