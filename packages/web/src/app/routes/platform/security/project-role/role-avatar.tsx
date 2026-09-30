import { RoleTone } from '@/features/members/lib/role-copy';
import { cn } from '@/lib/utils';

const toneClasses: Record<RoleTone, string> = {
  brand: 'bg-primary/10 text-primary',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  neutral: 'bg-muted text-muted-foreground',
  custom:
    'bg-warning-50 text-warning-700 dark:bg-warning-950 dark:text-warning-300',
};

export function RoleAvatar({ name, tone, className }: RoleAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-lg text-base font-medium leading-none',
        toneClasses[tone],
        className,
      )}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

type RoleAvatarProps = {
  name: string;
  tone: RoleTone;
  className?: string;
};
