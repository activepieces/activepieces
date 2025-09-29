import { t } from 'i18next';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/spinner';
import { InvitationCard } from '@/features/team/component/invitation-card';
import { ProjectMemberCard } from '@/features/team/component/project-member-card';
import { projectMembersHooks } from '@/features/team/lib/project-members-hooks';
import { userInvitationsHooks } from '@/features/team/lib/user-invitations-hooks';
import { ProjectMemberWithUser } from '@activepieces/ee-shared';

export const TeamSettings = () => {
  const {
    projectMembers,
    isLoading: projectMembersIsPending,
    refetch: refetchProjectMembers,
  } = projectMembersHooks.useProjectMembers();
  const { invitations, isLoading: invitationsIsPending } =
    userInvitationsHooks.useInvitations();

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {t('Project Members')}
          </CardTitle>
          <CardDescription className="text-sm">
            {t('Invite your team members to collaborate.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="min-h-[100px]">
            {projectMembersIsPending && (
              <div className="flex justify-center py-8">
                <LoadingSpinner className="w-6 h-6" />
              </div>
            )}
            {projectMembers && projectMembers.length === 0 && (
              <div className="text-center text-muted-foreground py-8 text-sm">
                {t('No members are added to this project.')}
              </div>
            )}
            <div className="space-y-3">
              {Array.isArray(projectMembers) &&
                projectMembers.map((member: ProjectMemberWithUser) => (
                  <div
                    key={member.id}
                    className="p-3 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <ProjectMemberCard
                      member={member}
                      onUpdate={refetchProjectMembers}
                    />
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {t('Pending Invitations')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="min-h-[100px]">
            {invitationsIsPending && (
              <div className="flex justify-center py-8">
                <LoadingSpinner className="w-6 h-6" />
              </div>
            )}
            {invitations && invitations.length === 0 && (
              <div className="text-center text-muted-foreground py-8 text-sm">
                {t('No pending invitation.')}
              </div>
            )}
            <div className="space-y-3">
              {Array.isArray(invitations) &&
                invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="p-3 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <InvitationCard invitation={invitation} />
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
