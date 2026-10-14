/**
 * @vitest-environment jsdom
 */
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  isPending: { current: false },
  content: {
    current: undefined as
      | undefined
      | {
          showCloseButton?: boolean;
          onEscapeKeyDown?: (event: { preventDefault: () => void }) => void;
        },
  },
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/features/connections/hooks/global-connections-hooks', () => ({
  globalConnectionsMutations: {
    useUpdateGlobalConnection: () => ({
      mutate: mocks.mutate,
      isPending: mocks.isPending.current,
    }),
  },
}));

vi.mock('@/features/projects/components/projects-selector', () => ({
  ProjectSelector: () => null,
}));

vi.mock('@/components/custom/global-connection-utils', () => ({
  GlobalConnectionWarning: () => null,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
  TooltipContent: () => null,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: React.PropsWithChildren<{ open: boolean }>) => (
    <div data-open={String(open)}>{children}</div>
  ),
  DialogTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
  DialogContent: ({
    children,
    showCloseButton,
    onEscapeKeyDown,
  }: React.PropsWithChildren<{
    showCloseButton?: boolean;
    onEscapeKeyDown?: (event: { preventDefault: () => void }) => void;
  }>) => {
    mocks.content.current = { showCloseButton, onEscapeKeyDown };
    return <div data-testid="content">{children}</div>;
  },
  DialogFooter: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

import { EditGlobalConnectionDialog } from '@/features/connections/components/edit-global-connection-dialog';

let container: HTMLDivElement;
let root: Root;

function render() {
  act(() => {
    root.render(
      <EditGlobalConnectionDialog
        connectionId="c1"
        currentName="Saved name"
        projectIds={['p1']}
        preSelectForNewProjects={false}
        onEdit={() => undefined}
        userHasPermissionToEdit
        adminFeedback
      />,
    );
  });
}

function buttonByText(text: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button')).find(
    (candidate) => candidate.textContent === text,
  );
  if (!button) {
    throw new Error(`missing button ${text}`);
  }
  return button;
}

function openDialog() {
  act(() => {
    container.querySelectorAll('button')[0].click();
  });
}

function nameInput(): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('#displayName');
  if (!input) {
    throw new Error('missing name input');
  }
  return input;
}

function typeName(value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set;
  act(() => {
    setter?.call(nameInput(), value);
    nameInput().dispatchEvent(new Event('input', { bubbles: true }));
  });
}

describe('EditGlobalConnectionDialog', () => {
  beforeEach(() => {
    mocks.isPending.current = false;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it('shows the saved values again after Cancel and reopen', () => {
    render();
    openDialog();
    expect(nameInput().value).toBe('Saved name');

    typeName('Cancelled edit');
    expect(nameInput().value).toBe('Cancelled edit');

    act(() => buttonByText('Cancel').click());
    openDialog();

    expect(nameInput().value).toBe('Saved name');
  });

  it('cannot be closed while saving', () => {
    mocks.isPending.current = true;
    render();
    openDialog();

    const preventDefault = vi.fn();
    mocks.content.current?.onEscapeKeyDown?.({ preventDefault });

    expect(preventDefault).toHaveBeenCalled();
    expect(mocks.content.current?.showCloseButton).toBe(false);
    expect(buttonByText('Cancel').disabled).toBe(true);
  });

  it('can be closed with Escape when not saving', () => {
    render();
    openDialog();

    const preventDefault = vi.fn();
    mocks.content.current?.onEscapeKeyDown?.({ preventDefault });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(mocks.content.current?.showCloseButton).toBe(true);
  });
});
