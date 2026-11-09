/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatEmptyState } from '@/app/routes/chat-with-ai/components/chat-empty-state';

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
      screen.getByText('Hi Maya, what can I help with?').closest(
        '[data-empty-state="narrow"]',
      )?.className,
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
