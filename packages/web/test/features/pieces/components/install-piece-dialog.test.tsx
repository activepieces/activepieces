/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-enabled-disabled, jest-dom/prefer-to-have-attribute, testing-library/no-node-access -- @testing-library/jest-dom is not a dependency of packages/web */
import { PieceScope } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InstallPieceDialog } from '@/features/pieces/components/install-piece-dialog';
import { PLAN_LIMIT_EVENT } from '@/lib/mutation-feedback';

const state = vi.hoisted(() => ({ install: vi.fn() }));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));
vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { plan: { managePiecesEnabled: true } },
    }),
  },
}));
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: true }) },
}));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'project-1' },
}));
vi.mock('@/components/custom/markdown', () => ({
  ApMarkdown: ({ markdown }: { markdown: string }) => <span>{markdown}</span>,
}));
vi.mock('@/features/pieces/api/pieces-api', () => ({
  piecesApi: { install: (...args: unknown[]) => state.install(...args) },
}));

function httpError({ status, data }: { status: number; data: unknown }) {
  return new AxiosError('fail', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: 'Error',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });
}

function openAndSubmit() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <InstallPieceDialog
        onInstallPiece={vi.fn()}
        scope={PieceScope.PLATFORM}
      />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Install Piece' }));
  fireEvent.change(screen.getByLabelText('Piece Name'), {
    target: { value: '@acme/piece-x' },
  });
  fireEvent.change(screen.getByLabelText('Piece Version'), {
    target: { value: '0.0.1' },
  });
  fireEvent.submit(screen.getByRole('button', { name: 'Install' }));
}

describe('InstallPieceDialog', () => {
  beforeEach(() => {
    state.install.mockReset();
  });

  it('stays open while installing', async () => {
    state.install.mockImplementation(() => new Promise(() => undefined));
    openAndSubmit();
    await waitFor(() => expect(state.install).toHaveBeenCalledTimes(1));

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Cancel' }).hasAttribute('disabled'),
    ).toBe(true);
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();

    const form = screen.getByRole('dialog').querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }
    expect(state.install).toHaveBeenCalledTimes(1);
  });

  it('shows the server message inline', async () => {
    state.install.mockRejectedValue(
      httpError({
        status: 400,
        data: { code: 'VALIDATION', params: { message: 'Bad version' } },
      }),
    );
    openAndSubmit();

    await screen.findByText('Bad version');
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('shows the network copy when the server is unreachable', async () => {
    state.install.mockRejectedValue(new AxiosError('Network Error'));
    openAndSubmit();

    await screen.findByText(
      "Couldn't reach the server. Check your connection and try again.",
    );
  });

  it('opens the plan dialog on a quota error', async () => {
    const onPlanLimit = vi.fn();
    window.addEventListener(PLAN_LIMIT_EVENT, onPlanLimit);
    state.install.mockRejectedValue(
      httpError({
        status: 402,
        data: { code: 'QUOTA_EXCEEDED', params: { message: 'Limit reached' } },
      }),
    );
    openAndSubmit();

    await screen.findByText('Limit reached');
    await waitFor(() => expect(onPlanLimit).toHaveBeenCalledTimes(1));
    window.removeEventListener(PLAN_LIMIT_EVENT, onPlanLimit);
  });
});
