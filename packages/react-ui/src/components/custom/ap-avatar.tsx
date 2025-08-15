import { UserAvatar } from '../ui/user-avatar';

interface ApAvatarProps {
  fullName: string;
  userEmail?: string;
  size: 'small' | 'medium';
  includeName?: boolean;
}

export const ApAvatar = ({
  fullName,
  userEmail,
  includeName = false,
  size = 'medium',
}: ApAvatarProps) => {
  const renderAvatar = () => {
    return (
      <UserAvatar
        name={fullName}
        email={userEmail!}
        size={size === 'small' ? 24 : 32}
        disableTooltip={includeName}
      />
    );
  };

  const content = (
    <div className="flex items-center gap-2">
      {renderAvatar()}
      {includeName && <span className="text-sm">{fullName}</span>}
    </div>
  );

  return content;
};
