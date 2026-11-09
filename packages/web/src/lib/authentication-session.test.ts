// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { authenticationSession } from './authentication-session';

describe('authenticationSession.subscribe', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'not-a-jwt');
    authenticationSession.setProjectId('a');
  });

  it('notifies for changes made in this tab', () => {
    const listener = vi.fn();
    const unsubscribe = authenticationSession.subscribe(listener);
    authenticationSession.switchToProject('b');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('ignores storage events from other tabs', () => {
    const listener = vi.fn();
    const unsubscribe = authenticationSession.subscribe(listener);
    localStorage.setItem('projectId', 'other');
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'projectId', newValue: 'other' }),
    );
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('does not notify when switching to the stored project', () => {
    const listener = vi.fn();
    const unsubscribe = authenticationSession.subscribe(listener);
    authenticationSession.switchToProject('a');
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});

describe('authenticationSession.getProjectId', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'not-a-jwt');
    authenticationSession.setProjectId('a');
  });

  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('uses the project in the URL over the stored one', () => {
    window.history.replaceState(
      null,
      '',
      '/projects/route-project/automations',
    );
    expect(authenticationSession.getProjectId()).toBe('route-project');
  });

  it('keeps the URL project when another tab stores a different one', () => {
    window.history.replaceState(null, '', '/projects/route-project/runs');
    localStorage.setItem('projectId', 'other');
    expect(authenticationSession.getProjectId()).toBe('route-project');
  });

  it('falls back to the stored project on pages without one', () => {
    window.history.replaceState(null, '', '/impact');
    expect(authenticationSession.getProjectId()).toBe('a');
  });

  it('returns null without a token', () => {
    localStorage.removeItem('token');
    window.history.replaceState(null, '', '/projects/route-project');
    expect(authenticationSession.getProjectId()).toBeNull();
  });
});
