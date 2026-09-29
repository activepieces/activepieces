/**
 * @vitest-environment jsdom
 */
import { InvitationStatus, ProjectType } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  ensureSeatsAvailable: vi.fn(
    (additionalSeats: number) => additionalSeats <= 0,
  ),
  invite: vi.fn(async ({ email }: { email: string }) => ({
    id: `inv-${email}`,
    email,
    status: InvitationStatus.ACCEPTED,
  })),
  emailsToEnter: [] as string[],
  platformUsersNext: null as string | null,
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/features/billing', () => ({
  useSeatLimitGuard: () => ({
    handleSeatLimitError: () => false,
    ensureSeatsAvailable: mocks.ensureSeatsAvailable,
    seatLimitDialog: null,
  }),
}));

vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({ embedState: { isEmbedded: false } }),
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { id: 'platform-1', plan: { projectRolesEnabled: true } },
    }),
  },
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: true }) },
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({ checkAccess: () => true }),
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/projects/project-1/members' }),
}));

vi.mock('@/features/projects/stores/project-collection', () => ({
  projectCollectionUtils: {
    useCurrentProject: () => ({
      project: {
        id: 'project-1',
        type: ProjectType.TEAM,
        displayName: 'Team Project',
      },
    }),
  },
}));

vi.mock('@/features/members/hooks/user-invitations-hooks', () => ({
  userInvitationsHooks: { useInvitations: () => ({ refetch: vi.fn() }) },
}));

vi.mock('@/features/members/hooks/project-members-hooks', () => ({
  projectMembersHooks: { useProjectMembers: () => ({ projectMembers: [] }) },
}));

vi.mock('@/features/platform-admin/hooks/platform-user-hooks', () => ({
  platformUserHooks: {
    useUsers: () => ({
      data: {
        data: [{ email: 'Existing@acme.com' }],
        next: mocks.platformUsersNext,
      },
    }),
  },
}));

vi.mock('@/features/members/api/user-invitation', () => ({
  userInvitationApi: { invite: mocks.invite },
}));

vi.mock(
  '@/features/members/components/invite-user/user-suggestions-popover',
  () => ({
    UserSuggestionsPopover: ({
      onChange,
    }: {
      onChange: (emails: ReadonlyArray<string>) => void;
    }) => (
      <button
        type="button"
        data-testid="enter-emails"
        onClick={() => onChange(mocks.emailsToEnter)}
      />
    ),
  }),
);

vi.mock('@/features/members/components/project-role-select', async () => {
  const { useEffect } = await import('react');
  return {
    ProjectRoleSelect: ({
      form,
    }: {
      form: { setValue: (name: string, value: string) => void };
    }) => {
      useEffect(() => {
        form.setValue('projectRole', 'Editor');
      }, [form]);
      return null;
    },
  };
});

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: React.PropsWithChildren<{ open: boolean }>) =>
    open ? <div>{children}</div> : null,
  DialogClose: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
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

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);

let container: HTMLDivElement;
let root: Root;

async function submitProjectInvite(emails: string[]) {
  mocks.emailsToEnter = emails;
  const queryClient = new QueryClient();
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <InviteUserDialog open={true} setOpen={() => undefined} />
      </QueryClientProvider>,
    );
  });
  await act(async () => {
    container
      .querySelector<HTMLButtonElement>('[data-testid="enter-emails"]')!
      .click();
  });
  await act(async () => {
    container
      .querySelector<HTMLButtonElement>('button[type="submit"]')!
      .click();
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('InviteUserDialog seat preflight for project invites at the seat cap', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    mocks.platformUsersNext = null;
    vi.clearAllMocks();
  });

  it('adds an existing platform user without asking for a seat', async () => {
    await submitProjectInvite(['existing@acme.com']);

    expect(mocks.ensureSeatsAvailable).toHaveBeenCalledWith(0);
    expect(mocks.invite).toHaveBeenCalledTimes(1);
    expect(mocks.invite).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'existing@acme.com',
        projectId: 'project-1',
      }),
    );
  });

  it('still blocks a new user when no seats are left', async () => {
    await submitProjectInvite(['new@acme.com']);

    expect(mocks.ensureSeatsAvailable).toHaveBeenCalledWith(1);
    expect(mocks.invite).not.toHaveBeenCalled();
  });

  it('counts only the new users in a mixed submission', async () => {
    await submitProjectInvite(['EXISTING@acme.com', 'new@acme.com']);

    expect(mocks.ensureSeatsAvailable).toHaveBeenCalledWith(1);
    expect(mocks.invite).not.toHaveBeenCalled();
  });

  it('leaves a single invite to the server when the platform user list is truncated', async () => {
    mocks.platformUsersNext = 'next-page-cursor';
    await submitProjectInvite(['unlisted@acme.com']);

    expect(mocks.ensureSeatsAvailable).toHaveBeenCalledWith(0);
    expect(mocks.invite).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'unlisted@acme.com' }),
    );
  });

  it('still preflights a batch when the platform user list is truncated', async () => {
    mocks.platformUsersNext = 'next-page-cursor';
    await submitProjectInvite(['unlisted@acme.com', 'new@acme.com']);

    expect(mocks.ensureSeatsAvailable).toHaveBeenCalledWith(2);
    expect(mocks.invite).not.toHaveBeenCalled();
  });
});
