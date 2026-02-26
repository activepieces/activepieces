import { isNil } from '@activepieces/shared';
import Avatar from 'boring-avatars';

import { cn } from '@/lib/utils';

import { Tooltip, TooltipTrigger, TooltipContent } from './tooltip';

type UserAvatarProps = {
  name: string;
  email: string;
  size: number;
  disableTooltip?: boolean;
  imageUrl?: string | null;
  className?: string;
  withoutBorder?: boolean;
};

export function UserAvatar({
  name,
  email,
  size,
  disableTooltip = false,
  imageUrl,
  className,
  withoutBorder = false,
}: UserAvatarProps) {
  const tooltip = `${name} (${email})`;

  const avatarElement = !isNil(imageUrl) ? (
    <img
      src={imageUrl}
      alt={name}
      width={size}
      height={size}
      className={cn('rounded-full aspect-square object-cover', className)}
      style={{ width: `${size}px !important`, height: `${size}px !important` }}
    />
  ) : (
    <Avatar
      name={email}
      size={size}
      colors={['#0a0310', '#49007e', '#ff005b', '#ff7d10', '#ffb238']}
      variant="beam"
      square
      className={cn('rounded-full', className)}
    />
  );

  if (disableTooltip) {
    return avatarElement;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('size-12 border', { 'border-none': withoutBorder })}>
          {avatarElement} {disableTooltip}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
