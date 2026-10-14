/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-value, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import {
  PlatformRole,
  UserStatus,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { UserActions } from '@/app/routes/platform/users/actions/user-actions';

vi.mock('i18next', () => ({
  t: (key: string, vars?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (match, name) => vars?.[name] ?? match),
}));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));
vi.mock('@/app/routes/platform/users/index', () => ({}));
vi.mock('@/api/platform-user-api', () => ({
  platformUserApi: { update: vi.fn() },
}));
vi.mock('@/hooks/user-hooks', () => ({
  userHooks: { useCurrentUser: () => ({ data: { id: 'admin-1' } }) },
}));
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuTrigger: () => null,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onSelect,
    disabled,
  }: {
    children: React.ReactNode;
    onSelect?: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" disabled={disabled} onClick={() => onSelect?.()}>
      {children}
    </button>
  ),
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

function buildUser(externalId: string): UserWithMetaInformation {
  return {
    id: 'u1',
    email: 'ana@acme.com',
    firstName: 'Ana',
    lastName: 'Lee',
    status: UserStatus.ACTIVE,
    externalId,
    platformId: 'p1',
    platformRole: PlatformRole.MEMBER,
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    lastActiveDate: null,
    imageUrl: null,
  };
}

function Harness({ user }: { user: UserWithMetaInformation }) {
  const [client] = React.useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <UserActions
        row={{ id: user.id, type: 'user', data: user }}
        isUpdatingStatus={false}
        onDelete={vi.fn()}
        onToggleStatus={vi.fn()}
        onUpdate={vi.fn()}
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

describe('UserActions', () => {
  it('keeps in-progress edits when the user row refetches with new data', () => {
    const { rerender } = render(<Harness user={buildUser('ext-1')} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(externalIdInput(), { target: { value: 'typed-edit' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Role' }), {
      target: { value: PlatformRole.ADMIN },
    });

    rerender(<Harness user={buildUser('ext-2')} />);

    expect(externalIdInput().value).toBe('typed-edit');
    expect(
      screen.getByRole<HTMLSelectElement>('combobox', { name: 'Role' }).value,
    ).toBe(PlatformRole.ADMIN);
  });
});
