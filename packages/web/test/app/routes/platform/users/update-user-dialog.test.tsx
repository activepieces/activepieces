/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-value, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import { PlatformRole } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { UpdateUserDialog } from '@/app/routes/platform/users/actions/update-user-dialog';

const state = vi.hoisted(() => ({ update: vi.fn() }));

vi.mock('i18next', () => ({
  t: (key: string, vars?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (match, name) => vars?.[name] ?? match),
}));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));
vi.mock('@/api/platform-user-api', () => ({
  platformUserApi: {
    update: (...args: unknown[]) => state.update(...args),
  },
}));
vi.mock('@/features/members', () => ({
  RoleSelector: ({
    value,
    onValueChange,
  }: {
    value: string;
    onValueChange: (value: string) => void;
  }) => (
    <select
      aria-label="Role"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      <option value={PlatformRole.ADMIN}>Admin</option>
      <option value={PlatformRole.MEMBER}>Member</option>
    </select>
  ),
}));

function Harness() {
  const [open, setOpen] = React.useState(false);
  return (
    <QueryClientProvider client={new QueryClient()}>
      <button type="button" onClick={() => setOpen(true)}>
        Edit user
      </button>
      <UpdateUserDialog
        open={open}
        onOpenChange={setOpen}
        onUpdate={vi.fn()}
        userId="u1"
        email="ana@acme.com"
        role={PlatformRole.MEMBER}
        externalId="ext-1"
      />
    </QueryClientProvider>
  );
}

function externalIdInput(): HTMLInputElement {
  const input = screen.getByLabelText('External ID');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('External ID is not an input');
  }
  return input;
}

describe('UpdateUserDialog', () => {
  it('stays open while a save is running', async () => {
    state.update = vi.fn(() => new Promise(() => undefined));
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit user' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(state.update).toHaveBeenCalledTimes(1));

    const cancel = screen.getByRole('button', { name: 'Cancel' });
    expect(cancel.hasAttribute('disabled')).toBe(true);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  });

  it('drops cancelled edits when it opens again', async () => {
    state.update = vi.fn().mockResolvedValue({
      platformRole: PlatformRole.MEMBER,
    });
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit user' }));
    fireEvent.change(externalIdInput(), { target: { value: 'typo' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Role' }), {
      target: { value: PlatformRole.ADMIN },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit user' }));
    expect(externalIdInput().value).toBe('ext-1');
    expect(
      screen.getByRole<HTMLSelectElement>('combobox', { name: 'Role' }).value,
    ).toBe(PlatformRole.MEMBER);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(state.update).toHaveBeenCalledWith('u1', {
        platformRole: PlatformRole.MEMBER,
        externalId: 'ext-1',
      }),
    );
  });
});
