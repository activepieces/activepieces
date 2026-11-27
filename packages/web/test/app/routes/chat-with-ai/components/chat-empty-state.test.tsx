/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ChatEmptyState,
  SetupRequiredState,
} from '@/app/routes/chat-with-ai/components/chat-empty-state';
import { chatPanelUtils } from '@/features/workspace/lib/chat-panel-open';

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, string>) =>
    key.replace('{name}', values?.name ?? ''),
}));

vi.mock('@/features/chat/lib/use-personalization', () => ({
  usePersonalization: () => ({ useCases: [], isResolving: false }),
}));

vi.mock('@/hooks/user-hooks', () => ({
  userHooks: { useCurrentUser: () => ({ data: { firstName: 'Maya' } }) },
}));

vi.mock('@/features/pieces/hooks/pieces-hooks', () => ({
  piecesHooks: { usePieces: () => ({ pieces: [], isLoading: false }) },
}));

const role = vi.hoisted(() => ({ admin: true }));

vi.mock('@/hooks/authorization-hooks', () => ({
  useIsPlatformAdmin: () => role.admin,
}));

vi.mock('@/app/routes/chat-with-ai/components/onboarding-welcome', () => ({
  OnboardingWelcome: () => <p>Onboarding</p>,
}));

describe('ChatEmptyState', () => {
  afterEach(cleanup);

  it('picks the narrow or wide state with the chat container query, without measuring', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    renderEmptyState({ onboarding: true });
    vi.unstubAllGlobals();

    expect(
      screen
        .getByText('Hi Maya, what can I help with?')
        .closest('[data-empty-state="narrow"]')?.className,
    ).toContain('@chat-md/chat:hidden');
    expect(
      screen.getByText('Onboarding').closest('[data-empty-state="wide"]')
        ?.className,
    ).toContain('@chat-md/chat:block');
  });
});

function renderEmptyState({ onboarding }: { onboarding: boolean }) {
  render(
    <MemoryRouter>
      <ChatEmptyState
        incognito={false}
        hasInput={false}
        onboarding={onboarding}
        showFlowCards={false}
        onSend={vi.fn()}
        onFill={vi.fn()}
      />
    </MemoryRouter>,
  );
}

describe('SetupRequiredState', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lets an admin open AI providers beside the chat', () => {
    role.admin = true;
    const openBeside = vi
      .spyOn(chatPanelUtils, 'openBeside')
      .mockReturnValue(true);
    render(<SetupRequiredState />);

    expect(
      screen.getByText('Connect an AI provider to start chatting.'),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Connect an AI provider' }),
    );

    expect(openBeside).toHaveBeenCalledWith({
      route: '/platform/ai',
      push: true,
      name: 'AI providers',
    });
  });

  it('tells a member to ask an admin, with no setup button', () => {
    role.admin = false;
    render(<SetupRequiredState />);

    expect(
      screen.getByText('Ask an admin to connect an AI provider.'),
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Connect an AI provider' }),
    ).toBeNull();
  });
});
