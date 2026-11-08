// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authenticationSession } from './authentication-session';

describe('authenticationSession.subscribe', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'not-a-jwt');
    authenticationSession.setProjectId('a');
  });

  it('fires for changes made in this tab', async () => {
    const listener = vi.fn();
    const unsubscribe = authenticationSession.subscribe(listener);
    authenticationSession.switchToProject('b');
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('ignores storage events from other tabs', async () => {
    const listener = vi.fn();
    const unsubscribe = authenticationSession.subscribe(listener);
    localStorage.setItem('projectId', 'other');
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'projectId', newValue: 'other' }),
    );
    await Promise.resolve();
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('batches several changes into one notification', async () => {
    const listener = vi.fn();
    const unsubscribe = authenticationSession.subscribe(listener);
    authenticationSession.switchToProject('b');
    authenticationSession.switchToProject('c');
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});

describe('authenticationSession.getTabProjectId', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'not-a-jwt');
    authenticationSession.setProjectId('a');
  });

  it('keeps the project this tab shows when another tab switches', () => {
    expect(authenticationSession.getTabProjectId()).toBe('a');
    localStorage.setItem('projectId', 'other');
    expect(authenticationSession.getTabProjectId()).toBe('a');
    expect(authenticationSession.getProjectId()).toBe('other');
  });

  it('follows switches made in this tab', () => {
    expect(authenticationSession.getTabProjectId()).toBe('a');
    authenticationSession.switchToProject('b');
    expect(authenticationSession.getTabProjectId()).toBe('b');
  });
});
