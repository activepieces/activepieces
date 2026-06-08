import React, { useMemo } from 'react';

import { UserAvatar } from '@/components/custom/user-avatar';
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
  const { data: currentUser } = userHooks.useCurrentUser();

  return useMemo(() => {
    const options: {
      value: string;
      label: string;
      icon?: React.ReactNode;
    }[] = [];

    if (currentUser) {
      const name = `${currentUser.firstName} ${currentUser.lastName}`;
      options.push({
        value: currentUser.id,
        label: name,
        icon: avatarIcon(name, currentUser.email, currentUser.imageUrl),
      });
    }

    return options;
  }, [currentUser]);
}
