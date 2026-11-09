/**
 * @vitest-environment jsdom
 */
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useBackgroundTitle } from '@/features/chat/lib/use-background-title';

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, unknown>) =>
    key.replace('{title}', String(values?.title)),
}));

beforeEach(() => {
  document.title = 'Automations';
  setVisibility('hidden');
});

afterEach(() => {
  cleanup();
  setVisibility('visible');
});

describe('useBackgroundTitle', () => {
  it('marks the tab when a reply finishes in the background', () => {
    const { rerender } = renderTitle({ streaming: true, needsYou: false });
    rerender({ streaming: false, needsYou: false });
    expect(document.title).toBe('✓ Automations');
  });

  it('says the chat needs you when the reply ends with a question', () => {
    const { rerender } = renderTitle({ streaming: true, needsYou: false });
    rerender({ streaming: false, needsYou: true });
    expect(document.title).toBe('Needs you: Automations');
  });

  it('restores the title when the tab is visible again', () => {
    const { rerender } = renderTitle({ streaming: true, needsYou: false });
    rerender({ streaming: false, needsYou: false });
    setVisibility('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(document.title).toBe('Automations');
  });

  it('leaves the title alone when the tab is visible', () => {
    setVisibility('visible');
    const { rerender } = renderTitle({ streaming: true, needsYou: false });
    rerender({ streaming: false, needsYou: false });
    expect(document.title).toBe('Automations');
  });

  it('keeps a title the page set meanwhile', () => {
    const { rerender } = renderTitle({ streaming: true, needsYou: false });
    rerender({ streaming: false, needsYou: false });
    document.title = 'Tables';
    setVisibility('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(document.title).toBe('Tables');
  });
});

function renderTitle(initialProps: { streaming: boolean; needsYou: boolean }) {
  return renderHook((props) => useBackgroundTitle(props), { initialProps });
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
}
