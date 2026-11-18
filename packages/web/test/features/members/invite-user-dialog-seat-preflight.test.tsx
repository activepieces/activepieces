/**
 * @vitest-environment jsdom
 */
import { InvitationStatus, ProjectType } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  emailsToEnter: [] as string[],
  ensureSeatsAvailable: vi.fn((_additionalSeats: number) => false),
  invite: vi.fn(async ({ email }: { email: string }) => ({
    id: `inv-${email}`,
    email,
    status: InvitationStatus.ACCEPTED,
  })),
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/lib/error-reporting', () => ({
  errorReporting: { report: vi.fn() },
}));

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
      platform: {
        id: 'platform-1',
        name: 'Acme',
        plan: { projectRolesEnabled: true },
      },
    }),
    useNewMemberSettings: () => ({
      activeDefaultProjectIds: [],
      personalProjectsActive: true,
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
    useAllPlatformProjects: () => ({ data: [] }),
    useCurrentProjectOrNull: () => ({
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
      data: { data: [{ email: 'Existing@acme.com' }], next: null },
    }),
    usePlatformInvitations: () => ({ data: [] }),
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

vi.mock(
  '@/features/members/components/invite-user/default-projects-note',
  () => ({ DefaultProjectsNote: () => null }),
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

async function submitEmails(emails: string[]) {
  mocks.emailsToEnter = emails;
  render(
    <QueryClientProvider client={new QueryClient()}>
      <InviteUserDialog open={true} setOpen={() => undefined} />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByTestId('enter-emails'));
  fireEvent.click(screen.getByRole('button', { name: 'Add' }));
  await vi.waitFor(() => {
    expect(
      mocks.invite.mock.calls.length +
        mocks.ensureSeatsAvailable.mock.calls.length,
    ).toBeGreaterThan(0);
  });
}

describe('InviteUserDialog seat preflight on a project invite at the seat cap', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('adds an existing platform member without asking for a seat', async () => {
    await submitEmails(['existing@acme.com']);

    expect(mocks.ensureSeatsAvailable).not.toHaveBeenCalled();
    expect(mocks.invite).toHaveBeenCalledTimes(1);
    expect(mocks.invite.mock.calls[0][0]).toMatchObject({
      email: 'existing@acme.com',
      projectId: 'project-1',
    });
  });

  it('asks for one seat per new email and sends nothing when none are free', async () => {
    await submitEmails(['existing@acme.com', 'new@acme.com']);

    expect(mocks.ensureSeatsAvailable).toHaveBeenCalledWith(1);
    expect(mocks.invite).not.toHaveBeenCalled();
  });
});
