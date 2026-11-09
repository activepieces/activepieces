/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DefaultRoute } from '@/app/guards/default-route';

const embed = vi.hoisted(() => ({ isEmbedded: false }));

vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({ embedState: { isEmbedded: embed.isEmbedded } }),
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({ platform: { plan: { chatEnabled: true } } }),
  },
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({ checkAccess: () => true }),
}));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: {
    getToken: () => 'token',
    isOnboarding: () => false,
    getProjectId: () => 'p1',
    appendProjectRoutePrefix: (path: string) => `/projects/p1${path}`,
  },
}));

vi.mock('@/app/components/no-projects-state', () => ({
  NoProjectsState: () => null,
}));

describe('DefaultRoute', () => {
  afterEach(cleanup);

  it('opens the chat when the plan has it', () => {
    embed.isEmbedded = false;
    renderAtRoot();

    expect(screen.getByText('Chat page')).toBeTruthy();
  });

  it('skips the chat inside an embed, where the chat is hidden', () => {
    embed.isEmbedded = true;
    renderAtRoot();

    expect(screen.getByText('Automations page')).toBeTruthy();
  });
});

function renderAtRoot() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<DefaultRoute />} />
        <Route path="/chat" element={<p>Chat page</p>} />
        <Route
          path="/projects/p1/automations"
          element={<p>Automations page</p>}
        />
      </Routes>
    </MemoryRouter>,
  );
}
