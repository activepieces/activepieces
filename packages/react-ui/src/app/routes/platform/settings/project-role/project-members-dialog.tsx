import { t } from 'i18next';
import { LoaderIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ProjectMemberCard } from '@/features/team/component/project-member-card';
import { projectMembersHooks } from '@/features/team/lib/project-members-hooks';
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
  const {
    projectMembers,
    refetch: refetchProjectMembers,
    isLoading,
  } = projectMembersHooks.useProjectMembers();
  const [isProjectMembersUpdated, setIsProjectMembersUpdated] = useState(false);
  const [selectedProjectMembers, setSelectedProjectMembers] = useState<
    ProjectMemberWithUser[]
  >([]);

  useEffect(() => {
    if (isOpen) {
      refetchProjectMembers().then(() => {
        if (projectRole) {
          setSelectedProjectMembers(
            projectMembers?.filter(
              (member) => member.projectRole.id === projectRole.id,
            ) || [],
          );
        }
      });
    }
  }, [projectMembers]);

  useEffect(() => {
    if (isProjectMembersUpdated) {
      refetchProjectMembers().then(() => {
        refetch();
        if (projectRole) {
          setSelectedProjectMembers(
            projectMembers?.filter(
              (member) => member.projectRole.id === projectRole.id,
            ) || [],
          );
        }
      });
    }
  }, [isProjectMembersUpdated, projectRole]);

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
            Array.isArray(projectMembers) &&
            selectedProjectMembers.map((member) => (
              <ProjectMemberCard
                key={member.id}
                member={member}
                setIsProjectMembersUpdated={setIsProjectMembersUpdated}
              />
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProjectMembersDialog;
