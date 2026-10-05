/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-enabled-disabled, jest-dom/prefer-to-have-text-content -- @testing-library/jest-dom is not a dependency of packages/web */
import {
  ApplicationEventName,
  EventDestination,
  EventDestinationScope,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { toastMock, collectionUtilsMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn() },
  collectionUtilsMock: {
    update: vi.fn(),
    delete: vi.fn(),
    useCreateEventDestination: () => ({ mutate: vi.fn(), isPending: false }),
    useTestEventDestination: () => ({ mutate: vi.fn(), isPending: false }),
    useImportHandlerFlow: () => ({ mutate: vi.fn(), isPending: false }),
  },
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('sonner', () => ({ toast: toastMock }));

vi.mock('@/lib/api', () => ({
  api: {
    isError: () => false,
    serverErrorMessage: () => undefined,
    extractServerErrorMessage: (error: unknown, fallback: string) =>
      error instanceof Error ? error.message : fallback,
  },
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: 'http://localhost/api/v1/webhooks' }) },
}));

vi.mock(
  '@/app/routes/platform/infra/event-destinations/lib/event-destinations-collection',
  () => ({ eventDestinationsCollectionUtils: collectionUtilsMock }),
);

vi.mock(
  '@/app/routes/platform/infra/event-destinations/lib/handler-flow-builder',
  () => ({ handlerFlowBuilder: {} }),
);

vi.mock(
  '@/app/routes/platform/infra/event-destinations/lib/use-event-labels',
  () => ({
    useEventLabels: () =>
      new Proxy({}, { get: (_, key) => ({ label: String(key) }) }),
  }),
);

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({
    checked,
    onCheckedChange,
    id,
  }: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    id: string;
  }) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(event) => onCheckedChange(event.target.checked)}
    />
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: React.PropsWithChildren) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => (
    <>{children}</>
  ),
  DropdownMenuContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onSelect: _onSelect,
    variant: _variant,
  }: React.PropsWithChildren<{ onSelect?: unknown; variant?: string }>) => (
    <div role="menuitem">{children}</div>
  ),
}));

vi.mock('@/components/ui/dialog', async () => {
  const { createContext, useContext } = await import('react');
  const DialogContext = createContext<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }>({ open: false, onOpenChange: () => {} });
  return {
    Dialog: ({
      children,
      open,
      onOpenChange,
    }: React.PropsWithChildren<{
      open: boolean;
      onOpenChange: (open: boolean) => void;
    }>) => (
      <DialogContext.Provider value={{ open, onOpenChange }}>
        {children}
      </DialogContext.Provider>
    ),
    DialogTrigger: ({ children }: React.PropsWithChildren) => {
      const { onOpenChange } = useContext(DialogContext);
      return <span onClick={() => onOpenChange(true)}>{children}</span>;
    },
    DialogContent: ({ children }: React.PropsWithChildren) => {
      const { open } = useContext(DialogContext);
      return open ? <div role="dialog">{children}</div> : null;
    },
    DialogHeader: ({ children }: React.PropsWithChildren) => (
      <div>{children}</div>
    ),
    DialogTitle: ({ children }: React.PropsWithChildren) => (
      <div>{children}</div>
    ),
    DialogDescription: ({ children }: React.PropsWithChildren) => (
      <div>{children}</div>
    ),
    DialogFooter: ({ children }: React.PropsWithChildren) => (
      <div>{children}</div>
    ),
  };
});

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    asChild: _asChild,
    variant: _variant,
    size: _size,
    loading: _loading,
    ...props
  }: React.ComponentProps<'button'> & {
    asChild?: boolean;
    variant?: string;
    size?: string;
    loading?: boolean;
  }) => <button {...props}>{children}</button>,
}));

import { EventDestinationDialog } from '@/app/routes/platform/infra/event-destinations/components/event-destination-dialog';

const destination: EventDestination = {
  id: 'dest1',
  created: '2026-01-01T00:00:00.000Z',
  updated: '2026-01-01T00:00:00.000Z',
  platformId: 'platform1',
  scope: EventDestinationScope.PLATFORM,
  events: [ApplicationEventName.FLOW_CREATED],
  url: 'https://old.example.com/hook',
};

const serverError = new Error('Destination not reachable');

function persistedTransaction() {
  return { isPersisted: { promise: Promise.resolve() } };
}

function failedTransaction() {
  return { isPersisted: { promise: Promise.reject(serverError) } };
}

function mount(element: React.ReactElement) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      {element}
    </QueryClientProvider>,
  );
}

function click(element: Element | null | undefined) {
  if (!element) {
    throw new Error('element not found');
  }
  fireEvent.click(element);
}

function findButton(text: string, scope: ParentNode = document.body) {
  return Array.from(scope.querySelectorAll('button')).find(
    (button) => button.textContent === text,
  );
}

function dialogs() {
  return screen.queryAllByRole('dialog');
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EventDestinationDialog edit', () => {
  function openDialog() {
    mount(
      <EventDestinationDialog destination={destination}>
        <button>open</button>
      </EventDestinationDialog>,
    );
    click(findButton('open'));
  }

  function changeUrlAndSave() {
    fireEvent.change(screen.getByPlaceholderText(/example\.com/), {
      target: { value: 'https://new.example.com/hook' },
    });
    return waitFor(() => {
      expect(findButton('Save')?.disabled).toBe(false);
    }).then(() => click(findButton('Save')));
  }

  it('keeps Save disabled until something changes', () => {
    openDialog();

    expect(findButton('Save')?.disabled).toBe(true);
  });

  it('shows the server error inline and keeps the dialog open when saving fails', async () => {
    collectionUtilsMock.update.mockImplementation(failedTransaction);

    openDialog();
    await changeUrlAndSave();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe(serverError.message);
    expect(collectionUtilsMock.update).toHaveBeenCalledWith(destination.id, {
      url: 'https://new.example.com/hook',
      events: destination.events,
    });
    expect(toastMock.error).not.toHaveBeenCalled();
    expect(toastMock.success).not.toHaveBeenCalled();
    expect(dialogs()).toHaveLength(1);
  });

  it('closes with an undo toast that restores the previous destination', async () => {
    collectionUtilsMock.update.mockImplementation(persistedTransaction);

    openDialog();
    await changeUrlAndSave();

    await waitFor(() => expect(dialogs()).toHaveLength(0));
    const [message, options] = toastMock.success.mock.calls[0];
    expect(message).toBe('Destination saved');
    expect(options.action.label).toBe('Undo');

    options.action.onClick();
    await waitFor(() =>
      expect(collectionUtilsMock.update).toHaveBeenLastCalledWith(
        destination.id,
        { url: destination.url, events: destination.events },
      ),
    );
  });
});
