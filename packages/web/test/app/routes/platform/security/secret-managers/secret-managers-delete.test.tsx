/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { toastMock, deleteMock } = vi.hoisted(() => ({
  toastMock: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
  deleteMock: vi.fn(),
}));

vi.mock('i18next', () => ({
  t: (key: string, params?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (match, param) => params?.[param] ?? match),
}));

vi.mock('sonner', () => ({ toast: toastMock }));

vi.mock('@/components/ui/sonner', () => ({
  INTERNAL_ERROR_MESSAGE: 'internal error',
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { id: 'p', plan: { secretManagersEnabled: true } },
    }),
  },
}));

vi.mock('@/features/secret-managers', () => ({
  secretManagersHooks: {
    useListSecretManagerConnections: () => ({
      data: [
        {
          id: 'conn-1',
          name: 'Vault',
          providerId: 'hashicorp',
          scope: 'PLATFORM',
          connection: { configured: true, connected: true },
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useClearCache: () => ({ mutate: vi.fn(), isPending: false }),
  },
}));

vi.mock('@/features/secret-managers/api/secret-managers-api', () => ({
  secretManagersApi: { delete: deleteMock },
}));

vi.mock(
  '@/app/routes/platform/security/secret-managers/connect-secret-manager-dialog',
  () => ({
    default: ({ children }: React.PropsWithChildren) => <>{children}</>,
  }),
);

vi.mock('@/features/pieces', () => ({ PieceIcon: () => null }));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
  TooltipContent: () => null,
  TooltipProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

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

vi.mock('@/app/components/admin', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@/app/components/admin')
  >();
  return { ...actual, AdminDataTable: RemountingTable };
});

type CellComponent = React.ComponentType<{ row: { original: unknown } }>;

function RemountingTable({
  columns,
  page,
}: {
  columns: { cell?: unknown }[];
  page?: { data: { id: string }[] };
}) {
  return (
    <div>
      {page?.data.map((item) => (
        <div key={item.id}>
          {columns.map((column, index) => {
            const Cell = column.cell as CellComponent;
            return <Cell key={index} row={{ original: item }} />;
          })}
        </div>
      ))}
    </div>
  );
}

import SecretManagersPage from '@/app/routes/platform/security/secret-managers';

const serverError = new AxiosError(
  'Request failed',
  'ERR_BAD_REQUEST',
  undefined,
  undefined,
  {
    status: 409,
    statusText: 'Conflict',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { params: { message: 'Connection is in use' } },
  },
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SecretManagersPage delete', () => {
  it('keeps the confirmation open and shows the error when deleting fails', async () => {
    let rejectDelete: (error: unknown) => void = () => undefined;
    deleteMock.mockReturnValue(
      new Promise((_, reject) => {
        rejectDelete = reject;
      }),
    );
    render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <SecretManagersPage />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getAllByText('Delete Vault?')).toHaveLength(1);
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Delete Connection' }),
    );

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith('conn-1'));
    rejectDelete(serverError);

    await screen.findByText('Connection is in use');
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(
      within(screen.getByRole('dialog')).getAllByText("Couldn't delete Vault"),
    ).toHaveLength(1);
    expect(toastMock.success).not.toHaveBeenCalled();
  });
});
