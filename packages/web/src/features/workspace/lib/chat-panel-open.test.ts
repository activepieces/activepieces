// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

async function loadStore() {
  vi.resetModules();
  const { useChatPanel } = await import('./chat-panel-open');
  return useChatPanel;
}

describe('chat panel follow along setting', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('is on by default', async () => {
    const store = await loadStore();
    expect(store.getState().autoFollow).toBe(true);
  });

  it('remembers when the user turns it off', async () => {
    const store = await loadStore();
    store.getState().setAutoFollow(false);
    expect(store.getState().autoFollow).toBe(false);
    const reloaded = await loadStore();
    expect(reloaded.getState().autoFollow).toBe(false);
  });

  it('remembers when the user turns it back on', async () => {
    window.localStorage.setItem('chat:auto-follow', 'false');
    const store = await loadStore();
    expect(store.getState().autoFollow).toBe(false);
    store.getState().setAutoFollow(true);
    const reloaded = await loadStore();
    expect(reloaded.getState().autoFollow).toBe(true);
  });
});
