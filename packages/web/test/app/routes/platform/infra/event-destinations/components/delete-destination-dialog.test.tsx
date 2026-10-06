/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { toastMock, collectionUtilsMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn() },
  collectionUtilsMock: {
    delete: vi.fn(),
  },
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('sonner', () => ({ toast: toastMock }));

vi.mock('@/lib/api', () => ({
  api: {
    isError: () => false,
    extractServerErrorMessage: (error: unknown, fallback: string) =>
      error instanceof Error ? error.message : fallback,
  },
}));

vi.mock(
  '@/app/routes/platform/infra/event-destinations/lib/event-destinations-collection',
  () => ({ eventDestinationsCollectionUtils: collectionUtilsMock }),
);

import { DeleteDestinationDialog } from '@/app/routes/platform/infra/event-destinations/components/delete-destination-dialog';

import { makeDestination } from '../event-destination-fixtures';

const destination = makeDestination();

function mount({
  onOpenChange,
  onDeleted,
}: {
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <DeleteDestinationDialog
        destination={destination}
        title="example.com"
        open={true}
        onOpenChange={onOpenChange}
        onDeleted={onDeleted}
      />
    </QueryClientProvider>,
  );
}

function confirmButton() {
  const button = screen
    .getAllByRole('button')
    .find((candidate) => candidate.textContent === 'Delete destination');
  if (!button) {
    throw new Error('confirm button not found');
  }
  return button;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DeleteDestinationDialog', () => {
  it('keeps the dialog open and shows the error when deleting fails', async () => {
    collectionUtilsMock.delete.mockRejectedValue(
      new Error('Destination not reachable'),
    );
    const onOpenChange = vi.fn();
    const onDeleted = vi.fn();
    mount({ onOpenChange, onDeleted });

    fireEvent.click(confirmButton());

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalled();
    });
    expect(collectionUtilsMock.delete).toHaveBeenCalledWith([destination.id]);
    expect(toastMock.error.mock.calls[0][0]).toBe(
      "Couldn't delete the destination",
    );
    expect(toastMock.success).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('closes and confirms only after deleting succeeds, with no undo', async () => {
    collectionUtilsMock.delete.mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    const onDeleted = vi.fn();
    mount({ onOpenChange, onDeleted });

    fireEvent.click(confirmButton());

    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith('Destination deleted');
    });
    expect(toastMock.success.mock.calls[0]).toHaveLength(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onDeleted).toHaveBeenCalled();
    expect(toastMock.error).not.toHaveBeenCalled();
  });
});
