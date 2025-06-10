import Avatar from 'boring-avatars';

import { flagsHooks } from '@/hooks/flags-hooks';

import { useTheme } from '../theme-provider';

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
  const branding = flagsHooks.useWebsiteBranding();
  const theme = useTheme();
  const colors =
    theme.theme === 'dark'
      ? [branding.colors.primary.dark, branding.colors.primary.light]
      : [branding.colors.primary.light, branding.colors.primary.dark];
  const avatarElement = (
    <Avatar name={email} size={size} colors={colors} variant="beam" />
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
