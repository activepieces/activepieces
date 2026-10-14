/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  invite: vi.fn(),
  refetch: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  feedbackError: vi.fn(),
  setOpen: vi.fn(),
  onOpenChange: { current: undefined as undefined | ((open: boolean) => void) },
}));

vi.mock('i18next', () => ({
  t: (key: string, params?: Record<string, unknown>) =>
    params ? `${key} ${JSON.stringify(params)}` : key,
}));

vi.mock('sonner', () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}));

vi.mock('@/lib/mutation-feedback', () => ({
  mutationFeedback: {
    message: (error: unknown) =>
      error instanceof Error ? error.message : 'unknown',
    error: mocks.feedbackError,
    success: vi.fn(),
  },
}));

vi.mock('@/lib/error-reporting', () => ({
  errorReporting: { report: vi.fn() },
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/platform/users' }),
}));

vi.mock('@/features/billing', () => ({
  useSeatLimitGuard: () => ({
    handleSeatLimitError: () => false,
    ensureSeatsAvailable: () => true,
    seatLimitDialog: null,
  }),
}));

vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({ embedState: { isEmbedded: false } }),
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { id: 'p1', plan: { projectRolesEnabled: false } },
    }),
  },
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: true }) },
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({ checkAccess: () => true }),
}));

vi.mock('@/features/members/hooks/user-invitations-hooks', () => ({
  userInvitationsHooks: { useInvitations: () => ({ refetch: mocks.refetch }) },
}));

vi.mock('@/features/members/hooks/project-members-hooks', () => ({
  projectMembersHooks: { useProjectMembers: () => ({ projectMembers: [] }) },
}));

vi.mock('@/features/platform-admin/hooks/platform-user-hooks', () => ({
  platformUserHooks: { useUsers: () => ({ data: { data: [] } }) },
}));

vi.mock('@/features/projects/stores/project-collection', () => ({
  projectCollectionUtils: {
    useCurrentProject: () => ({
      project: { id: 'proj1', displayName: 'Project', type: 'PERSONAL' },
    }),
  },
}));

vi.mock('@/features/members/api/user-invitation', () => ({
  userInvitationApi: { invite: mocks.invite },
}));

vi.mock('@/features/members/components/platform-role-select', () => ({
  PlatformRoleSelect: () => null,
}));

vi.mock('@/features/members/components/project-role-select', () => ({
  ProjectRoleSelect: () => null,
}));

vi.mock('@/components/custom/clipboard/copy-to-clipboard', () => ({
  CopyToClipboardInput: () => null,
}));

vi.mock(
  '@/features/members/components/invite-user/user-suggestions-popover',
  () => ({
    UserSuggestionsPopover: ({
      value,
      onChange,
    }: {
      value: string[];
      onChange: (emails: string[]) => void;
    }) => (
      <div>
        <span data-testid="emails">{value.join(',')}</span>
        <button
          type="button"
          data-testid="add-emails"
          onClick={() => onChange(['a@x.com', 'b@x.com', 'c@x.com'])}
        />
      </div>
    ),
  }),
);

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    children,
    open,
    onOpenChange,
  }: React.PropsWithChildren<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }>) => {
    mocks.onOpenChange.current = onOpenChange;
    return open ? <div>{children}</div> : null;
  },
  DialogClose: ({ children }: React.PropsWithChildren) => <>{children}</>,
  DialogContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogDescription: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogFooter: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

import { InviteUserDialog } from '@/features/members/components/invite-user/invite-user-dialog';

let container: HTMLDivElement;
let root: Root;

function render(adminFeedback = false) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  act(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <InviteUserDialog
          open
          setOpen={mocks.setOpen}
          adminFeedback={adminFeedback}
        />
      </QueryClientProvider>,
    );
  });
}

function query(selector: string): HTMLElement {
  const element = container.querySelector<HTMLElement>(selector);
  if (!element) {
    throw new Error(`missing ${selector}`);
  }
  return element;
}

async function addEmailsAndSubmit() {
  act(() => {
    query('[data-testid="add-emails"]').click();
  });
  await act(async () => {
    query('button[type="submit"]').click();
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('InviteUserDialog with some invitations failing', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it('says how many were sent and keeps only the failed emails with the reason', async () => {
    mocks.invite.mockImplementation(({ email }: { email: string }) =>
      email === 'b@x.com'
        ? Promise.reject(new Error('Email domain is blocked'))
        : Promise.resolve({ id: email, email, status: 'PENDING' }),
    );
    render(true);

    await addEmailsAndSubmit();

    expect(query('[data-testid="emails"]').textContent).toBe('b@x.com');
    expect(container.textContent).toContain(
      '{email}: {reason} {"email":"b@x.com","reason":"Email domain is blocked"}',
    );
    expect(mocks.refetch).toHaveBeenCalled();
    expect(mocks.setOpen).not.toHaveBeenCalledWith(false);
  });

  it('reports the partial failure through mutationFeedback on admin pages', async () => {
    mocks.invite.mockImplementation(({ email }: { email: string }) =>
      email === 'c@x.com'
        ? Promise.reject(new Error('boom'))
        : Promise.resolve({ id: email, email, status: 'PENDING' }),
    );
    render(true);

    await addEmailsAndSubmit();

    expect(mocks.feedbackError).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'invitationsSentOfTotal {"sent":2,"total":3}',
      }),
    );
    expect(query('[data-testid="emails"]').textContent).toBe('c@x.com');
  });

  it('cannot be closed while the invitations are being sent', async () => {
    mocks.invite.mockImplementation(() => new Promise(() => undefined));
    render(true);

    await addEmailsAndSubmit();
    act(() => {
      mocks.onOpenChange.current?.(false);
    });

    expect(mocks.setOpen).not.toHaveBeenCalled();
    const cancel = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Cancel',
    );
    expect(cancel?.hasAttribute('disabled')).toBe(true);
  });
});
