/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-enabled-disabled, jest-dom/prefer-checked, jest-dom/prefer-to-have-attribute, jest-dom/prefer-to-have-text-content -- @testing-library/jest-dom is not a dependency of packages/web */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('sonner', () => ({ toast }));
vi.mock('i18next', () => ({
  t: (key: string, vars?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (match, name) => vars?.[name] ?? match),
}));

import { AdminQueryState } from '@/app/components/admin/admin-query-state';
import { ConfirmDialog } from '@/app/components/admin/confirm-dialog';
import { InstantSwitch } from '@/app/components/admin/instant-switch';
import { SaveBar } from '@/app/components/admin/save-bar';
import {
  adminBulk,
  useAdminAction,
} from '@/app/components/admin/use-admin-action';

function serverError(message: string) {
  return new AxiosError(message, 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { message },
  });
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
});

describe('useAdminAction', () => {
  it('says what was done, by name', async () => {
    const { result } = renderHook(
      () =>
        useAdminAction({
          verb: 'delete',
          name: 'Marketing',
          run: async () => undefined,
        }),
      { wrapper },
    );
    await act(() => result.current.mutateAsync());
    expect(toast.success).toHaveBeenCalledWith('Marketing deleted');
  });

  it('shows one error with the server message and remembers it', async () => {
    const failure = serverError('Project has enabled flows');
    const { result } = renderHook(
      () =>
        useAdminAction({
          verb: 'delete',
          name: 'Marketing',
          run: async () => {
            throw failure;
          },
        }),
      { wrapper },
    );
    await act(() => result.current.mutateAsync().catch(() => undefined));
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't delete Marketing",
      expect.objectContaining({ description: 'Project has enabled flows' }),
    );
  });

  it('leaves errors to the form when feedback is inline', async () => {
    const { result } = renderHook(
      () =>
        useAdminAction({
          verb: 'save',
          name: '',
          run: async () => {
            throw serverError('Name taken');
          },
          feedback: 'inline',
        }),
      { wrapper },
    );
    await act(() => result.current.mutateAsync().catch(() => undefined));
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe('ConfirmDialog', () => {
  it('stays open and shows the error once when the action fails', async () => {
    const failure = serverError('Still in use');
    function Harness() {
      const action = useAdminAction({
        verb: 'delete',
        name: 'Key',
        run: async () => {
          throw failure;
        },
      });
      return (
        <ConfirmDialog
          open
          title="Delete Key?"
          confirmLabel="Delete"
          onConfirm={() => action.mutateAsync()}
        />
      );
    }
    render(<Harness />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('closes once the action succeeds', async () => {
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="Delete Key?"
        confirmLabel="Delete"
        onConfirm={async () => undefined}
      />,
      { wrapper },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('asks for the name only when told to', () => {
    render(
      <ConfirmDialog
        open
        title="Delete Marketing?"
        confirmLabel="Delete project"
        typeToConfirm="Marketing"
        onConfirm={async () => undefined}
      />,
      { wrapper },
    );
    const confirm = screen.getByRole('button', { name: 'Delete project' });
    expect(confirm.hasAttribute('disabled')).toBe(true);
    fireEvent.change(screen.getByLabelText('To confirm, type Marketing'), {
      target: { value: 'Marketing' },
    });
    expect(confirm.hasAttribute('disabled')).toBe(false);
  });
});

describe('InstantSwitch', () => {
  it('flips at once and flips back with one error when saving fails', async () => {
    let fail: (error: unknown) => void = () => undefined;
    render(
      <InstantSwitch
        aria-label="Email sign-in"
        checked={false}
        onCheckedChange={() =>
          new Promise((_, reject) => {
            fail = reject;
          })
        }
      />,
    );
    const toggle = screen.getByRole('switch', { name: 'Email sign-in' });
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    await act(async () => fail(serverError('Keep one sign-in method')));
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it('offers undo when asked', async () => {
    render(
      <InstantSwitch
        aria-label="Telemetry"
        checked={false}
        undo
        successMessage={(next) => (next ? 'Telemetry on' : 'Telemetry off')}
        onCheckedChange={async () => undefined}
      />,
    );
    fireEvent.click(screen.getByRole('switch', { name: 'Telemetry' }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Telemetry on',
        expect.objectContaining({
          action: expect.objectContaining({ label: 'Undo' }),
        }),
      ),
    );
  });

  it('asks first when turning it off could lock people out', async () => {
    const save = vi.fn(async () => undefined);
    render(
      <InstantSwitch
        aria-label="Email sign-in"
        checked
        onCheckedChange={save}
        confirmBefore={(next) =>
          next
            ? null
            : { title: 'Turn off email sign-in?', confirmLabel: 'Turn off' }
        }
      />,
      { wrapper },
    );
    fireEvent.click(screen.getByRole('switch', { name: 'Email sign-in' }));
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Turn off' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(false));
  });
});

describe('AdminQueryState', () => {
  it('reports a failed load instead of an empty state', () => {
    render(
      <AdminQueryState
        isLoading={false}
        isError
        isEmpty
        entity="API keys"
        empty={<p>No API keys yet</p>}
      >
        <p>keys</p>
      </AdminQueryState>,
    );
    expect(screen.getByText('Trouble loading API keys')).toBeTruthy();
    expect(screen.queryByText('No API keys yet')).toBeNull();
  });

  it('shows the empty state only once loaded', () => {
    render(
      <AdminQueryState
        isLoading={false}
        isError={false}
        isEmpty
        entity="API keys"
        empty={<p>No API keys yet</p>}
      >
        <p>keys</p>
      </AdminQueryState>,
    );
    expect(screen.getByText('No API keys yet')).toBeTruthy();
  });
});

describe('SaveBar', () => {
  it('shows the save error and offers Discard', () => {
    render(
      <SaveBar
        dirty={false}
        saving={false}
        error="Name is taken"
        onDiscard={() => undefined}
        guardNavigation={false}
      />,
    );
    expect(screen.getByRole('alert').textContent).toContain('Name is taken');
    expect(screen.getByRole('button', { name: 'Discard' })).toBeTruthy();
  });
});

describe('adminBulk.runEach', () => {
  it('keeps what succeeded and reports the failures once', async () => {
    const run = vi.fn(async (id: number) => {
      if (id === 2) {
        throw serverError('In use');
      }
    });
    await adminBulk.runEach({
      items: [1, 2, 3],
      run,
      verb: 'delete',
      label: (count) => `${count} items`,
    });
    expect(run).toHaveBeenCalledTimes(3);
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't delete 1 items",
      expect.objectContaining({ description: 'In use' }),
    );
  });

  it('fails when every item failed', async () => {
    await expect(
      adminBulk.runEach({
        items: [1, 2],
        run: async () => {
          throw serverError('Nope');
        },
        verb: 'delete',
        label: (count) => `${count} items`,
      }),
    ).rejects.toBeTruthy();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
