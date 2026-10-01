import { isNil } from '@activepieces/core-utils';
import Avatar from 'boring-avatars';
import { useEffect, useState } from 'react';

import { useTheme } from '@/components/providers/theme-provider';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { colorsUtils } from '@/lib/color-utils';
import { cn } from '@/lib/utils';

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
      className={cn(
        'aspect-square shrink-0 rounded-full object-cover',
        className,
      )}
      style={{ width: size, height: size }}
    />
  ) : (
    <GeneratedAvatar email={email} size={size} className={className} />
  );

  if (disableTooltip) {
    return avatarElement;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn('shrink-0 rounded-full', {
            'ring-1 ring-gray-6': !withoutBorder,
          })}
          style={{ width: size, height: size }}
        >
          {avatarElement}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function GeneratedAvatar({
  email,
  size,
  className,
}: {
  email: string;
  size: number;
  className?: string;
}) {
  const colors = useAvatarColors();
  return (
    <Avatar
      name={email}
      size={size}
      colors={colors}
      variant="beam"
      square
      className={cn('shrink-0 rounded-full', className)}
    />
  );
}

function useAvatarColors(): string[] {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState(
    () => resolvedColorsByTheme.get(resolvedTheme) ?? tokenColors(),
  );
  useEffect(() => {
    const cached = resolvedColorsByTheme.get(resolvedTheme);
    if (cached) {
      setColors(cached);
      return;
    }
    const frame = requestAnimationFrame(() => {
      const resolved =
        resolvedColorsByTheme.get(resolvedTheme) ?? resolveAvatarColors();
      resolvedColorsByTheme.set(resolvedTheme, resolved);
      setColors(resolved);
    });
    return () => cancelAnimationFrame(frame);
  }, [resolvedTheme]);
  return colors;
}

function resolveAvatarColors(): string[] {
  const resolved = AVATAR_TOKENS.map(colorsUtils.resolveToken);
  return resolved.every((color) => color !== null)
    ? resolved.flatMap((color) => (color === null ? [] : [color]))
    : tokenColors();
}

function tokenColors(): string[] {
  return AVATAR_TOKENS.map((token) => `var(${token})`);
}

const resolvedColorsByTheme = new Map<string, string[]>();

const AVATAR_TOKENS = [
  '--swatch-1-mark',
  '--swatch-3-mark',
  '--swatch-5-mark',
  '--swatch-8-mark',
  '--swatch-11-mark',
];
