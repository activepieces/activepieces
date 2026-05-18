import React, { useMemo } from 'react';

import { UserAvatar } from '@/components/custom/user-avatar';
import { projectMembersHooks } from '@/features/members/hooks/project-members-hooks';
import { userHooks } from '@/hooks/user-hooks';

function avatarIcon(name: string, email: string, imageUrl?: string | null) {
  return React.createElement(UserAvatar, {
    name,
    email,
    imageUrl,
    size: 20,
    disableTooltip: true,
  });
}

export function useOwnerOptions() {
  const { projectMembers } = projectMembersHooks.useProjectMembers();
  const { data: currentUser } = userHooks.useCurrentUser();

  return useMemo(() => {
    const options: {
      value: string;
      label: string;
      icon?: React.ReactNode;
    }[] = [];
    const seenIds = new Set<string>();

    if (currentUser) {
      const name = `${currentUser.firstName} ${currentUser.lastName}`;
      options.push({
        value: currentUser.id,
        label: name,
        icon: avatarIcon(name, currentUser.email, currentUser.imageUrl),
      });
      seenIds.add(currentUser.id);
    }

    for (const member of projectMembers ?? []) {
      if (!seenIds.has(member.userId)) {
        const name = `${member.user.firstName} ${member.user.lastName}`;
        options.push({
          value: member.userId,
          label: name,
          icon: avatarIcon(name, member.user.email, member.user.imageUrl),
        });
        seenIds.add(member.userId);
      }
    }

    return options;
  }, [currentUser, projectMembers]);
}
