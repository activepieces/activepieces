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

describe('chat panel saved layout', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('docks left by default', async () => {
    const store = await loadStore();
    expect(store.getState().mode).toBe('left');
  });

  it('loads a saved floating card as a right dock', async () => {
    window.localStorage.setItem(
      'chat-panel',
      JSON.stringify({
        mode: 'float',
        float: { x: 10, y: 20 },
        floatSize: { width: 400, height: 640 },
        dockWidth: 400,
      }),
    );
    const store = await loadStore();
    expect(store.getState().mode).toBe('right');
    expect(store.getState().dockWidth).toBe(400);
    store.getState().setDockWidth(420);
    expect(JSON.parse(window.localStorage.getItem('chat-panel') ?? '')).toEqual(
      { mode: 'right', dockWidth: 420 },
    );
  });
});
