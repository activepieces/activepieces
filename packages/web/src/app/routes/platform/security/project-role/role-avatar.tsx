import { ItemMedia } from '@/components/ui/item';
import { cn } from '@/lib/utils';

export function RoleAvatar({ name, className }: RoleAvatarProps) {
  return (
    <ItemMedia
      variant="icon"
      className={cn('text-sm font-medium text-muted-foreground', className)}
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase()}
    </ItemMedia>
  );
}

type RoleAvatarProps = {
  name: string;
  className?: string;
};
