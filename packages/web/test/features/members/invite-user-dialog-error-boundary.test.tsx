/**
 * @vitest-environment jsdom
 */
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/lib/error-reporting', () => ({
  errorReporting: { report: vi.fn() },
}));

vi.mock('@/features/billing', () => ({
  useSeatLimitGuard: () => {
    throw new TypeError("Cannot read properties of undefined (reading 'find')");
  },
}));

vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({ embedState: { isEmbedded: false } }),
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: { useCurrentPlatform: () => ({ platform: { id: 'p1' } }) },
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: React.PropsWithChildren<{ open: boolean }>) =>
    open ? <div>{children}</div> : null,
  DialogClose: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogDescription: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogFooter: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

import { InviteUserDialog } from '@/features/members/components/invite-user/invite-user-dialog';
import { errorReporting } from '@/lib/error-reporting';

let container: HTMLDivElement;
let root: Root;

function renderDialog(open: boolean) {
  act(() => {
    root.render(<InviteUserDialog open={open} setOpen={() => undefined} />);
  });
}

describe('InviteUserDialog contains its own render failures', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('does not rethrow when a hook inside it throws', () => {
    expect(() => renderDialog(true)).not.toThrow();
  });

  it('shows the fallback instead of an empty page while open', () => {
    renderDialog(true);

    expect(container.textContent).toContain('Something went wrong');
    expect(container.textContent).toContain('Reload page');
  });

  it('reports the swallowed error so it is not silent', () => {
    renderDialog(true);

    expect(errorReporting.report).toHaveBeenCalledTimes(1);
    expect(vi.mocked(errorReporting.report).mock.calls[0][0]).toMatchObject({
      source: 'react-error-boundary',
    });
  });

  it('renders nothing when closed', () => {
    renderDialog(false);

    expect(container.textContent).toBe('');
  });
});
