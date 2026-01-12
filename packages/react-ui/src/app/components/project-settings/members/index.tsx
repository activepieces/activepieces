import { t } from 'i18next';
import { Users } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DataTableInputPopover } from '@/components/ui/data-table/data-table-input-popover';
import { InviteUserDialog } from '@/features/members/component/invite-user-dialog';
import { projectMembersHooks } from '@/features/members/lib/project-members-hooks';
import { userInvitationsHooks } from '@/features/members/lib/user-invitations-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { Permission } from '@activepieces/shared';

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
    const members: MemberRowData[] =
      projectMembers?.map((member) => ({
        id: member.id,
        type: 'member' as const,
        data: member,
      })) ?? [];

    const pendingInvitations: MemberRowData[] =
      invitations?.map((invitation) => ({
        id: invitation.id,
        type: 'invitation' as const,
        data: invitation,
      })) ?? [];

    return [...members, ...pendingInvitations];
  }, [projectMembers, invitations]);

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
            {t('Invite members')}
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
        isLoading={projectMembersIsPending || invitationsIsPending}
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
