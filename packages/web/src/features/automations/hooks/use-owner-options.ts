import { useMemo } from 'react';

import { projectMembersHooks } from '@/features/members/lib/project-members-hooks';
import { userHooks } from '@/hooks/user-hooks';

export function useOwnerOptions() {
  const { projectMembers } = projectMembersHooks.useProjectMembers();
  const { data: currentUser } = userHooks.useCurrentUser();

  return useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const seenIds = new Set<string>();

    if (currentUser) {
      options.push({
        value: currentUser.id,
        label: `${currentUser.firstName} ${currentUser.lastName}`,
      });
      seenIds.add(currentUser.id);
    }

    for (const member of projectMembers ?? []) {
      if (!seenIds.has(member.userId)) {
        options.push({
          value: member.userId,
          label: `${member.user.firstName} ${member.user.lastName}`,
        });
        seenIds.add(member.userId);
      }
    }

    return options;
  }, [currentUser, projectMembers]);
}
