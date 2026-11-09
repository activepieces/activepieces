/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatEmptyState } from '@/app/routes/chat-with-ai/components/chat-empty-state';

const personalization = vi.hoisted(() => vi.fn());
const width = vi.hoisted(() => ({ value: 0 }));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/features/chat/lib/use-personalization', () => ({
  usePersonalization: (...args: unknown[]) => {
    personalization(...args);
    return { useCases: [], isResolving: false };
  },
}));

vi.mock('@/hooks/user-hooks', () => ({
  userHooks: { useCurrentUser: () => ({ data: { firstName: 'Maya' } }) },
}));

vi.mock('@/app/routes/chat-with-ai/components/onboarding-welcome', () => ({
  OnboardingWelcome: () => <p>Onboarding</p>,
}));

describe('ChatEmptyState', () => {
  beforeEach(() => {
    personalization.mockReset();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {
          return undefined;
        }
        disconnect() {
          return undefined;
        }
      },
    );
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => DOMRect.fromRect({ width: width.value, height: 600 }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('mounts only the narrow state in a narrow chat', () => {
    width.value = 372;
    renderEmptyState({ onboarding: false });

    expect(screen.getByText('Hi {name}, what can I help with?')).toBeTruthy();
    expect(personalization).not.toHaveBeenCalled();
  });

  it('mounts only the wide state in a wide chat', () => {
    width.value = 900;
    renderEmptyState({ onboarding: true });

    expect(screen.getByText('Onboarding')).toBeTruthy();
    expect(screen.queryByText('Hi {name}, what can I help with?')).toBeNull();
  });
});

function renderEmptyState({ onboarding }: { onboarding: boolean }) {
  render(
    <ChatEmptyState
      incognito={false}
      hasInput={false}
      onboarding={onboarding}
      showFlowCards={false}
      onSend={vi.fn()}
    />,
  );
}
