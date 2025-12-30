import { UserAvatar } from '../ui/user-avatar';
import { userApi } from '@/lib/user-api';

import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
interface ApAvatarProps {
  type: "user"
  id: string;
  size: 'small' | 'medium';
  includeAvatar?: boolean;
  includeName?: boolean;
}

export const ApAvatar = ({
  type,
  id,
  includeAvatar = true,
  includeName = false,
  size = 'medium',
}: ApAvatarProps) => {

  const avatarSize = size === 'small' ? 24 : 32;

  const [user, setUser] = useState<{
    firstName: string;
    lastName: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    userApi.getUserById(id).then(u => {
      if (isMounted) {
        setUser(u);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [id]);

  const content = (
    <div className="flex items-center gap-2">
      {includeAvatar && (
        user ? (
          <UserAvatar
            name={`${user.firstName} ${user.lastName}`}
            email={user.email}
            size={avatarSize}
            disableTooltip={true}
          />
        ) : (
          <Skeleton className="rounded-full" style={{ width: avatarSize, height: avatarSize }} />
        )
      )}
      {includeName && (
        user ? (
          <span className="text-sm">{`${user.firstName} ${user.lastName}`}</span>
        ) : (
          <Skeleton className="h-4 w-20 rounded" />
        )
      )}
    </div>
  );

  return content;
};
