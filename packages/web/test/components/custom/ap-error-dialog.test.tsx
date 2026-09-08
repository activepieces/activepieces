/**
 * @vitest-environment jsdom
 */
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

const collapsibleJsonMock = vi.hoisted(() => ({
  defaultOpen: undefined as boolean | undefined,
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('lucide-react', () => ({
  AlertCircleIcon: () => null,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    ...props
  }: React.ComponentProps<'button'>) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: React.PropsWithChildren) => <>{children}</>,
  DialogContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogDescription: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogFooter: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTitle: ({ children }: React.PropsWithChildren) => <h1>{children}</h1>,
}));

vi.mock('@/components/custom/collapsible-json', () => ({
  CollapsibleJson: ({ defaultOpen }: { defaultOpen?: boolean }) => {
    collapsibleJsonMock.defaultOpen = defaultOpen;
    return null;
  },
}));

// eslint-disable-next-line import/first
import { ApErrorDialog } from '@/components/custom/ap-error-dialog/ap-error-dialog';
// eslint-disable-next-line import/first
import { useApErrorDialogStore } from '@/components/custom/ap-error-dialog/ap-error-dialog-store';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  useApErrorDialogStore.getState().closeDialog();
  collapsibleJsonMock.defaultOpen = undefined;
});

describe('ApErrorDialog', () => {
  it('shows the friendly piece message and keeps technical details collapsed', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      useApErrorDialogStore.getState().openDialog({
        title: 'Status update failed',
        description: <p>Could not update the flow.</p>,
        error: JSON.stringify({
          __apErrorVersion: 1,
          message: 'Authentication required',
          raw: 'stack trace and request details',
        }),
      });
      root.render(<ApErrorDialog />);
    });

    expect(container.textContent).toContain('Authentication required');
    expect(container.textContent).not.toContain('stack trace and request details');
    expect(collapsibleJsonMock.defaultOpen).toBe(false);
  });

  it('shows the friendly nested standardError and keeps technical details collapsed', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      useApErrorDialogStore.getState().openDialog({
        title: 'Status update failed',
        description: <p>Could not update the flow.</p>,
        error: {
          standardError: JSON.stringify({
            __apErrorVersion: 1,
            message: 'Authentication required',
            raw: 'stack trace and request details',
          }),
          standardOutput: 'not used',
        },
      });
      root.render(<ApErrorDialog />);
    });

    expect(container.textContent).toContain('Authentication required');
    expect(container.textContent).not.toContain('stack trace and request details');
    expect(collapsibleJsonMock.defaultOpen).toBe(false);
  });
});
