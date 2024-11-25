import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { LoaderIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ProjectMemberCard } from '@/features/team/component/project-member-card';
import { projectMembersApi } from '@/features/team/lib/project-members-api';
import { authenticationSession } from '@/lib/authentication-session';
import { ProjectMemberWithUser } from '@activepieces/ee-shared';
import { ProjectRole } from '@activepieces/shared';

type ProjectMembersProps = {
  projectRole: ProjectRole | null;
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
};

function ProjectMembersDialog({
  projectRole,
  isOpen,
  onClose,
  refetch,
}: ProjectMembersProps) {
  const [isProjectMembersUpdated, setIsProjectMembersUpdated] = useState(false);
  const [selectedProjectMembers, setSelectedProjectMembers] = useState<
    ProjectMemberWithUser[]
  >([]);

  const {
    data,
    isLoading,
    refetch: refetchProjectMembers,
  } = useQuery({
    queryKey: ['project-members-dialog'],
    queryFn: () =>
      projectMembersApi.list({
        projectId: authenticationSession.getProjectId()!,
        cursor: undefined,
        limit: 100,
      }),
  });

  useEffect(() => {
    if (isOpen) {
      refetchProjectMembers().then(() => {
        if (projectRole) {
          setSelectedProjectMembers(
            data?.data?.filter(
              (member) => member.projectRoleId === projectRole.id,
            ) || [],
          );
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isProjectMembersUpdated) {
      refetchProjectMembers().then(() => {
        refetch();
        setIsProjectMembersUpdated(false);
      });
    }
  }, [isProjectMembersUpdated]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md">
        <DialogTitle className="h-10">
          {t(projectRole ? `Members: ${projectRole.name}` : 'Members')}
        </DialogTitle>
        <div className="flex flex-col gap-4">
          {isLoading && (
            <div className="flex justify-center animate-spin">
              <LoaderIcon />
            </div>
          )}
          {!isLoading &&
            selectedProjectMembers &&
            selectedProjectMembers.length === 0 && (
              <div className="text-center">
                {t('No members are added to this role.')}
              </div>
            )}
          {!isLoading &&
            Array.isArray(selectedProjectMembers) &&
            selectedProjectMembers.map((member) => (
              <ProjectMemberCard
                key={member.id}
                member={member}
                setIsProjectMembersUpdated={() => {
                  setIsProjectMembersUpdated(true);
                  setSelectedProjectMembers(
                    selectedProjectMembers.filter((m) => m.id !== member.id),
                  );
                }}
              />
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProjectMembersDialog;
