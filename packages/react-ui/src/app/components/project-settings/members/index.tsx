import { t } from 'i18next';
import { Users } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DataTableInputPopover } from '@/components/ui/data-table/data-table-input-popover';
import { InviteUserDialog } from '@/features/members/component/invite-user/invite-user-dialog';
import { projectMembersHooks } from '@/features/members/lib/project-members-hooks';
import { userInvitationsHooks } from '@/features/members/lib/user-invitations-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformUserHooks } from '@/hooks/platform-user-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import {
  InvitationType,
  Permission,
  PlatformRole,
  UserStatus,
} from '@activepieces/shared';

import { membersTableColumns, MemberRowData } from './columns';

export const MembersSettings = () => {
  const {
    projectMembers,
    isLoading: projectMembersIsPending,
    refetch: refetchProjectMembers,
  } = projectMembersHooks.useProjectMembers();
  const {
    invitations,
    isLoading: invitationsIsPending,
    refetch: refetchInvitations,
  } = userInvitationsHooks.useInvitations();
  const { data: platformUsersData, isLoading: platformUsersIsPending } =
    platformUserHooks.useUsers();

  const [filterValue, setFilterValue] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  const { checkAccess } = useAuthorization();
  const userHasPermissionToInviteUser = checkAccess(
    Permission.WRITE_INVITATION,
  );

  const refetch = useCallback(() => {
    refetchProjectMembers();
    refetchInvitations();
  }, [refetchProjectMembers, refetchInvitations]);

  const combinedData: MemberRowData[] = useMemo(() => {
    const currentProjectId = authenticationSession.getProjectId();

    const members: MemberRowData[] =
      projectMembers
        ?.filter((member) => member.user.status === UserStatus.ACTIVE)
        .map((member) => ({
          id: member.id,
          type: 'member' as const,
          data: member,
        })) ?? [];

    const pendingInvitations: MemberRowData[] =
      invitations
        ?.filter(
          (invitation) =>
            invitation.projectId === currentProjectId &&
            invitation.type === InvitationType.PROJECT,
        )
        .map((invitation) => ({
          id: invitation.id,
          type: 'invitation' as const,
          data: invitation,
        })) ?? [];

    const projectMemberEmails = new Set(
      projectMembers?.map((member) => member.user.email.toLowerCase()) ?? [],
    );

    const platformAdminsAndOperators: MemberRowData[] =
      platformUsersData?.data
        ?.filter(
          (user) =>
            user.status === UserStatus.ACTIVE &&
            (user.platformRole === PlatformRole.ADMIN ||
              user.platformRole === PlatformRole.OPERATOR) &&
            !projectMemberEmails.has(user.email.toLowerCase()),
        )
        .map((user) => ({
          id: user.id,
          type: 'platform-admin-operator' as const,
          data: user,
        })) ?? [];

    return [...members, ...platformAdminsAndOperators, ...pendingInvitations];
  }, [projectMembers, invitations, platformUsersData]);

  const filteredData = useMemo(() => {
    if (!filterValue) {
      return combinedData;
    }
    const searchValue = filterValue.toLowerCase();
    return combinedData.filter((row) => {
      if (row.type === 'member') {
        const fullName =
          `${row.data.user.firstName} ${row.data.user.lastName}`.toLowerCase();
        const email = row.data.user.email.toLowerCase();
        return fullName.includes(searchValue) || email.includes(searchValue);
      } else if (row.type === 'platform-admin-operator') {
        const fullName =
          `${row.data.firstName} ${row.data.lastName}`.toLowerCase();
        const email = row.data.email.toLowerCase();
        return fullName.includes(searchValue) || email.includes(searchValue);
      } else {
        const email = row.data.email.toLowerCase();
        return email.includes(searchValue);
      }
    });
  }, [combinedData, filterValue]);

  const columns = useMemo(
    () =>
      membersTableColumns({
        refetch,
      }),
    [refetch],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 justify-between">
        <DataTableInputPopover
          title={t('Search')}
          filterValue={filterValue}
          handleFilterChange={setFilterValue}
        />
        {userHasPermissionToInviteUser && (
          <Button onClick={() => setInviteOpen(true)}>
            {t('Add Members')}
          </Button>
        )}
      </div>
      <DataTable
        columns={columns}
        page={{
          data: filteredData,
          next: null,
          previous: null,
        }}
        isLoading={
          projectMembersIsPending ||
          invitationsIsPending ||
          platformUsersIsPending
        }
        hidePagination={true}
        emptyStateTextTitle={t('No members found')}
        emptyStateTextDescription={t(
          'Start by inviting team members to collaborate.',
        )}
        emptyStateIcon={<Users className="size-14" />}
      />
      <InviteUserDialog open={inviteOpen} setOpen={setInviteOpen} />
    </div>
  );
};
