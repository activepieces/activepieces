import Avatar from 'boring-avatars';

import { Tooltip, TooltipTrigger, TooltipContent } from './tooltip';

type UserAvatarProps = {
  name: string;
  email: string;
  size: number;
  disableTooltip?: boolean;
};

export function UserAvatar({
  name,
  email,
  size,
  disableTooltip = false,
}: UserAvatarProps) {
  const tooltip = `${name} (${email})`;

  const avatarElement = (
    <Avatar
      name={email}
      size={size}
      colors={['#0a0310', '#49007e', '#ff005b', '#ff7d10', '#ffb238']}
      variant="bauhaus"
      square
      className="rounded-lg"
    />
  );

  if (disableTooltip) {
    return avatarElement;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>
          {avatarElement} {disableTooltip}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
