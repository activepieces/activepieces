import { useQuery } from '@tanstack/react-query';
import { ProjectMemberWithUser } from '@/lib/ee-shared-stub';

export const projectMembersHooks = {
  useProjectMembers: () => {
    const query = useQuery<ProjectMemberWithUser[]>({
      queryKey: ['project-members'],
      queryFn: async () => [],
    });
    return { projectMembers: query.data ?? [], ...query };
  },
};
