import { ProjectMemberWithUser } from '@activepieces/ee-shared';
import { t } from 'i18next';
import { LoaderIcon } from 'lucide-react';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ProjectMemberCard } from '@/features/team/component/project-member-card';
import { projectMembersHooks } from '@/features/team/lib/project-members-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

export default function ProjectMembersPage() {
  const {
    projectMembers,
    isLoading: projectMembersIsPending,
    refetch: refetchProjectMembers,
  } = projectMembersHooks.useProjectMembers();

  const { platform } = platformHooks.useCurrentPlatform();

  return (
    <LockedFeatureGuard
      featureKey="TEAM"
      locked={!platform.plan.projectRolesEnabled}
      lockTitle={t('Unlock Team Permissions')}
      lockDescription={t(
        'You can invite users to your Platform for free in the community edition. For advanced roles and permissions request trial',
      )}
    >
      <div className="w-full flex flex-col items-center justify-center gap-4">
        <DashboardPageHeader
          title={t('Project Members')}
          description={t('Invite your team members to collaborate.')}
        />
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl">{t('Project Members')}</CardTitle>
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
            <CardTitle className="text-xl">
              {t('Pending Invitations')}
            </CardTitle>
          </CardContent>
        </Card>
      </div>
    </LockedFeatureGuard>
  );
}
