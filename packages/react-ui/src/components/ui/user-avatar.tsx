import Avatar from 'boring-avatars';

import { cn } from '@/lib/utils';

import { Tooltip, TooltipTrigger, TooltipContent } from './tooltip';

type UserAvatarProps = {
  name: string;
  email: string;
  size: number;
  disableTooltip?: boolean;
  imageUrl?: string | null;
};

export function UserAvatar({
  name,
  email,
  size,
  disableTooltip = false,
  imageUrl,
}: UserAvatarProps) {
  const tooltip = `${name} (${email})`;

  const avatarElement = imageUrl ? (
    <img
      src={imageUrl}
      alt={name}
      width={size}
      height={size}
      className={cn('rounded-full object-cover')}
      style={{ width: size, height: size }}
    />
  ) : (
    <Avatar
      name={email}
      size={size}
      colors={['#0a0310', '#49007e', '#ff005b', '#ff7d10', '#ffb238']}
      variant="beam"
      square
      className="rounded-full"
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
