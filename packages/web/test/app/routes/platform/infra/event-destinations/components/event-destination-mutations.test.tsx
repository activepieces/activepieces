/**
 * @vitest-environment jsdom
 */
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

vi.mock('@/components/ui/sonner', () => ({
  INTERNAL_ERROR_MESSAGE: 'internal error',
}));

vi.mock('@/lib/api', () => ({
  api: {
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

import EventDestinationActions from '@/app/routes/platform/infra/event-destinations/components/event-destination-actions';
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

async function settle() {
  await waitFor(() => {
    expect(
      toastMock.error.mock.calls.length + toastMock.success.mock.calls.length,
    ).toBeGreaterThan(0);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EventDestinationDialog edit', () => {
  function openAndSave() {
    mount(
      <EventDestinationDialog destination={destination}>
        <button>open</button>
      </EventDestinationDialog>,
    );
    click(findButton('open'));
    click(findButton('Save changes'));
  }

  it('shows the server error and keeps the dialog open when saving fails', async () => {
    collectionUtilsMock.update.mockImplementation(failedTransaction);

    openAndSave();
    await settle();

    expect(collectionUtilsMock.update).toHaveBeenCalledWith(destination.id, {
      url: destination.url,
      events: destination.events,
    });
    expect(toastMock.error).toHaveBeenCalledWith('Error', {
      description: serverError.message,
    });
    expect(toastMock.success).not.toHaveBeenCalled();
    expect(dialogs()).toHaveLength(1);
  });

  it('shows success and closes the dialog only after saving succeeds', async () => {
    collectionUtilsMock.update.mockImplementation(persistedTransaction);

    openAndSave();
    await settle();

    expect(toastMock.success).toHaveBeenCalledWith('Success', {
      description: 'Destination updated successfully',
    });
    expect(toastMock.error).not.toHaveBeenCalled();
    expect(dialogs()).toHaveLength(0);
  });
});

describe('EventDestinationActions delete', () => {
  function confirmDelete() {
    mount(<EventDestinationActions destination={destination} />);
    const deleteItem = screen
      .getAllByRole('menuitem')
      .find((item) => item.textContent === 'Delete');
    click(deleteItem);
    click(findButton('Delete', dialogs()[0]));
  }

  it('shows the server error instead of success when deleting fails', async () => {
    collectionUtilsMock.delete.mockImplementation(failedTransaction);

    confirmDelete();
    await settle();

    expect(collectionUtilsMock.delete).toHaveBeenCalledWith([destination.id]);
    expect(toastMock.error).toHaveBeenCalledWith('Error', {
      description: serverError.message,
    });
    expect(toastMock.success).not.toHaveBeenCalled();
    expect(dialogs()).toHaveLength(1);
  });

  it('shows success and closes the confirmation only after deleting succeeds', async () => {
    collectionUtilsMock.delete.mockImplementation(persistedTransaction);

    confirmDelete();
    await settle();

    expect(toastMock.success).toHaveBeenCalledWith('Removed {entityName}');
    expect(toastMock.error).not.toHaveBeenCalled();
    expect(dialogs()).toHaveLength(0);
  });
});
