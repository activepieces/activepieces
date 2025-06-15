import { AvatarImage } from '@radix-ui/react-avatar';
import { Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { UserAvatar } from '../ui/user-avatar';

interface ApAvatarProps {
  type: 'agent' | 'user' | 'flow';
  fullName: string;
  userEmail?: string;
  pictureUrl?: string;
  profileUrl?: string;
  size: 'small' | 'medium';
  includeName?: boolean;
}

export const ApAvatar = ({
  type,
  fullName,
  userEmail,
  pictureUrl,
  profileUrl,
  includeName = false,
  size = 'medium',
}: ApAvatarProps) => {
  const renderAvatar = () => {
    if (type === 'agent') {
      return (
        <Avatar className={size === 'small' ? 'w-6 h-6' : 'w-8 h-8'}>
          <AvatarImage
            src={pictureUrl}
            alt={fullName}
            className={`${size} rounded-full`}
          />
        </Avatar>
      );
    }

    if (type === 'user') {
      return (
        <UserAvatar
          name={fullName}
          email={userEmail!}
          size={size === 'small' ? 24 : 32}
          disableTooltip={true}
        />
      );
    }

    return (
      <Avatar className={size === 'small' ? 'w-6 h-6' : 'w-8 h-8'}>
        <AvatarFallback
          className={`text-xs font-bold border ${
            size === 'small' ? 'w-6 h-6' : 'w-8 h-8'
          }`}
        >
          <Workflow className="p-1" />
        </AvatarFallback>
      </Avatar>
    );
  };

  const content = (
    <div className="flex items-center gap-2">
      {renderAvatar()}
      {includeName && <span className="text-sm">{fullName}</span>}
    </div>
  );

  if (type === 'agent' && profileUrl) {
    return <Link to={profileUrl}>{content}</Link>;
  }

  return content;
};
