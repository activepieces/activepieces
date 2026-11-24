/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ResourceLockWidget } from '@/components/custom/resource-lock-widget';

vi.mock('i18next', () => ({
  t: (key: string, values?: { name?: string }) =>
    key.replace('{name}', values?.name ?? ''),
}));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getCurrentUserId: () => 'current-user' },
}));

let container: HTMLDivElement;
let root: Root;

function render(lockedBy: { userId: string; userDisplayName: string }) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<ResourceLockWidget lockedBy={lockedBy} takeOver={vi.fn()} />);
  });
  return container;
}

describe('ResourceLockWidget', () => {
  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('names the other user who holds the lock', () => {
    const view = render({
      userId: 'other-user',
      userDisplayName: 'Other User',
    });

    expect(view.textContent).toContain('Other User is editing');
  });

  it('says the flow is open in another tab when the same user holds the lock', () => {
    const view = render({ userId: 'current-user', userDisplayName: 'Me' });

    expect(view.textContent).toContain(
      'Open for editing in another tab or window',
    );
    expect(view.textContent).not.toContain('Me is editing');
  });
});
