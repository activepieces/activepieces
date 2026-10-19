/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from '@/app/components/admin/confirm-dialog';
import { InstantSwitch } from '@/app/components/admin/instant-switch';
import {
  adminBulk,
  useAdminAction,
} from '@/app/components/admin/use-admin-action';
import { PLAN_LIMIT_EVENT } from '@/lib/mutation-feedback';

import { adminTestKit, toastMock as toast } from './admin-test-kit';

vi.mock('sonner', async () => ({
  toast: (await import('./admin-test-kit')).toastMock,
}));
vi.mock('i18next', async () => (await import('./admin-test-kit')).i18nextMock);

const { serverError, quotaError, queryWrapper: wrapper } = adminTestKit;

function undoFromToast(call = 0) {
  return toast.success.mock.calls[call][1].action.onClick;
}

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
});

afterEach(async () => {
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
});

describe('useAdminAction', () => {
  it('lets the page handle a plan limit itself, without the generic plan dialog', async () => {
    const planDialog = vi.fn();
    window.addEventListener(PLAN_LIMIT_EVENT, planDialog);
    const { result } = renderHook(
      () =>
        useAdminAction({
          verb: 'activate',
          name: 'Ann',
          handleError: () => true,
          run: async () => {
            throw quotaError();
          },
        }),
      { wrapper },
    );
    await act(() => result.current.mutateAsync().catch(() => undefined));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(planDialog).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    window.removeEventListener(PLAN_LIMIT_EVENT, planDialog);
  });
});

describe('ConfirmDialog', () => {
  it('closes and opens the plan dialog once on a plan limit', async () => {
    const onOpenChange = vi.fn();
    const planDialog = vi.fn();
    window.addEventListener(PLAN_LIMIT_EVENT, planDialog);
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="Invite Ana?"
        confirmLabel="Invite"
        onConfirm={async () => {
          throw quotaError();
        }}
      />,
      { wrapper },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    await waitFor(() => expect(planDialog).toHaveBeenCalledTimes(1));
    expect(toast.error).not.toHaveBeenCalled();
    window.removeEventListener(PLAN_LIMIT_EVENT, planDialog);
  });
});

describe('InstantSwitch', () => {
  it('refuses an undo into a state that is blocked now', async () => {
    const save = vi.fn(async () => undefined);
    const props = {
      'aria-label': 'Google',
      undo: true,
      successMessage: (next: boolean) => (next ? 'Google on' : 'Google off'),
      onCheckedChange: save,
    };
    const { rerender } = render(<InstantSwitch {...props} checked={false} />, {
      wrapper,
    });
    fireEvent.click(screen.getByRole('switch', { name: 'Google' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    rerender(
      <InstantSwitch {...props} checked blockedReason="Only way to sign in." />,
    );
    await act(async () => undoFromToast()());
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't undo",
        expect.objectContaining({ description: 'Only way to sign in.' }),
      ),
    );
    expect(save).toHaveBeenCalledTimes(1);
  });
});

describe('bulk delete with ConfirmDialog', () => {
  it('stays open on a partial failure, lists why, and retries only the failed items', async () => {
    const failing = new Set(['b']);
    const deleted: string[] = [];
    function Harness() {
      const [items, setItems] = React.useState(['a', 'b']);
      const run = async (item: string) => {
        if (failing.has(item)) throw serverError('In use');
        deleted.push(item);
      };
      return (
        <ConfirmDialog
          open
          title="Delete items?"
          confirmLabel="Delete"
          onConfirm={() =>
            adminBulk
              .runEach({
                items,
                run,
                verb: 'delete',
                label: String,
                nameOf: String,
              })
              .catch((error: unknown) => {
                setItems(adminBulk.failedItems({ error, items }));
                throw error;
              })
          }
        />
      );
    }
    render(<Harness />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await screen.findByText('b: In use');
    failing.clear();
    fireEvent.click(screen.getByRole('button', { name: 'Retry failed' }));
    await waitFor(() => expect(deleted).toEqual(['a', 'b']));
    expect(toast.error).not.toHaveBeenCalled();
  });
});
