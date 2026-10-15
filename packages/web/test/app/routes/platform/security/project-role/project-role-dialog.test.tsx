/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-enabled-disabled, jest-dom/prefer-to-have-attribute, jest-dom/prefer-to-have-text-content -- @testing-library/jest-dom is not a dependency of packages/web */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectRoleDialog } from '@/app/routes/platform/security/project-role/project-role-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';

const state = vi.hoisted(() => ({
  create: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  gateResult: Promise.resolve() as Promise<unknown>,
}));

vi.mock('i18next', () => ({
  t: (key: string, vars?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (match, name) => vars?.[name] ?? match),
}));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: (...args: unknown[]) => state.success(...args),
    error: (...args: unknown[]) => state.error(...args),
  }),
}));
vi.mock('@/features/platform-admin/api/project-role-api', () => ({
  projectRoleApi: {
    create: (...args: unknown[]) => state.create(...args),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('@/features/platform-admin', async () => {
  const hooks = await import(
    '@/features/platform-admin/hooks/project-role-hooks'
  );
  const roleApi = await import(
    '@/features/platform-admin/api/project-role-api'
  );
  return {
    projectRoleApi: roleApi.projectRoleApi,
    projectRoleMutations: hooks.projectRoleMutations,
  };
});
vi.mock('@/app/routes/platform/security/project-role/permission-grid', () => ({
  PermissionGrid: () => <div>permissions</div>,
}));
vi.mock('@/app/routes/platform/security/project-role/role-people-tab', () => ({
  RolePeopleTab: () => <div>people</div>,
}));
vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { id: 'p', plan: { customRolesEnabled: true } },
    }),
  },
}));
vi.mock('@/features/billing', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/billing')>()),
  useEnterpriseGate: () => ({
    access: 'entitled',
    locked: false,
    run: (action: () => unknown) => {
      state.gateResult = Promise.resolve(action());
      state.gateResult.catch(() => undefined);
    },
    explain: vi.fn(),
  }),
}));

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

function renderDialog() {
  const onSave = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider>
        <ProjectRoleDialog mode="create" onSave={onSave}>
          <button type="button">Open roles</button>
        </ProjectRoleDialog>
      </TooltipProvider>
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Open roles' }));
  return { onSave };
}

function typeName(name: string) {
  fireEvent.change(screen.getByPlaceholderText('Role name'), {
    target: { value: name },
  });
}

function createButton() {
  return screen.getByRole('button', { name: 'Create role' });
}

describe('ProjectRoleDialog create', () => {
  beforeEach(() => {
    state.create.mockReset();
    state.success.mockReset();
    state.error.mockReset();
  });

  it('stays open and blocks a second create while saving', async () => {
    state.create.mockImplementation(() => new Promise(() => undefined));
    renderDialog();
    typeName('Ops');
    fireEvent.click(createButton());
    await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1));

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Cancel' }).hasAttribute('disabled'),
    ).toBe(true);
    expect(
      screen.getByRole('button', { name: 'Close' }).hasAttribute('disabled'),
    ).toBe(true);

    fireEvent.click(createButton());
    expect(state.create).toHaveBeenCalledTimes(1);
  });

  it('creates once when Create is double-clicked', async () => {
    state.create.mockImplementation(() => new Promise(() => undefined));
    renderDialog();
    typeName('Ops');
    const button = createButton();
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(state.create).toHaveBeenCalledTimes(1);
  });

  it('shows the failure inline and keeps the typed name', async () => {
    state.create.mockRejectedValue(new Error('boom'));
    renderDialog();
    typeName('Ops');
    fireEvent.click(createButton());

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe(
      'An unexpected error occurred. Please try again in a moment.',
    );
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(
      screen.getByPlaceholderText<HTMLInputElement>('Role name').value,
    ).toBe('Ops');
  });

  it('hands the gate a save that fails when the create fails', async () => {
    state.create.mockRejectedValue(new Error('boom'));
    renderDialog();
    typeName('Ops');
    fireEvent.click(createButton());

    await expect(state.gateResult).rejects.toThrow('boom');
  });

  it('closes and shows a created toast on success', async () => {
    state.create.mockResolvedValue({});
    const { onSave } = renderDialog();
    typeName('Ops');
    fireEvent.click(createButton());

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(state.success).toHaveBeenCalledWith('Ops created', {
        id: 'Ops created',
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('rejects names the server does not accept', () => {
    renderDialog();
    typeName('QA r/1');

    expect(screen.getByRole('alert').textContent).toBe(
      "Role names can't contain a dot (.) or a slash (/).",
    );
    expect(createButton().hasAttribute('disabled')).toBe(true);
    fireEvent.click(createButton());
    expect(state.create).not.toHaveBeenCalled();
  });
});
