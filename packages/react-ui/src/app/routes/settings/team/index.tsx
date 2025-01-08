import { t } from 'i18next';
import { LoaderIcon } from 'lucide-react';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { InvitationCard } from '@/features/team/component/invitation-card';
import { InviteUserDialog } from '@/features/team/component/invite-user-dialog';
import { ProjectMemberCard } from '@/features/team/component/project-member-card';
import { projectMembersHooks } from '@/features/team/lib/project-members-hooks';
import { userInvitationsHooks } from '@/features/team/lib/user-invitations-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { ProjectMemberWithUser } from '@activepieces/ee-shared';

export default function TeamPage() {
  const {
    projectMembers,
    isLoading: projectMembersIsPending,
    refetch: refetchProjectMembers,
  } = projectMembersHooks.useProjectMembers();
  const { invitations, isLoading: invitationsIsPending } =
    userInvitationsHooks.useInvitations();

  const { platform } = platformHooks.useCurrentPlatform();

  return (
    <LockedFeatureGuard
      featureKey="TEAM"
      locked={!platform.projectRolesEnabled}
      cloudOnlyFeature={true}
      lockTitle={t('Unlock Team Permissions')}
      lockDescription={t(
        'You can invite users to your Platform for free in the community edition. For advanced roles and permissions request trial',
      )}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{t('Project Members')}</CardTitle>
            <CardDescription>
              {t('Invite your team members to collaborate.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 ">
            <div className="flex min-h-[35px] flex-col gap-4">
              {projectMembersIsPending && (
                <div className="flex justify-center animate-spin">
                  <LoaderIcon></LoaderIcon>
                </div>
              )}
              {projectMembers && projectMembers.length === 0 && (
                <div className="text-center">
                  {t('No members are added to this project.')}
                </div>
              )}

              {Array.isArray(projectMembers) &&
                projectMembers.map((member: ProjectMemberWithUser) => (
                  <div key={member.id} className="flex items-center">
                    <ProjectMemberCard
                      member={member}
                      onUpdate={refetchProjectMembers}
                    />
                  </div>
                ))}
            </div>
            <Separator />
            <div className="text-2xl font-bold tracking-tight">
              {t('Pending Invitations')}
            </div>
            <div className="flex min-h-[35px] flex-col gap-4">
              {invitationsIsPending && (
                <div className="flex justify-center animate-spin">
                  <LoaderIcon></LoaderIcon>
                </div>
              )}
              {invitations && invitations.length === 0 && (
                <div className="text-center">{t('No pending invitation.')}</div>
              )}
              {Array.isArray(invitations) &&
                invitations.map((invitation) => (
                  <InvitationCard
                    key={invitation.id}
                    invitation={invitation}
                  ></InvitationCard>
                ))}
            </div>
            <div className="mt-4 flex items-center  space-x-2">
              <div className="flex-grow">
                <InviteUserDialog></InviteUserDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </LockedFeatureGuard>
  );
}
