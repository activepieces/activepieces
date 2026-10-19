import { RoleTone } from '@/features/members/lib/role-copy';
import { cn } from '@/lib/utils';

const toneClasses: Record<RoleTone, string> = {
  brand: 'bg-accent-3 text-accent-11',
  info: 'bg-swatch-11-surface text-swatch-11-ink',
  neutral: 'bg-gray-3 text-gray-11',
  custom: 'bg-warning-3 text-warning-11',
};

export function RoleAvatar({ name, tone, className }: RoleAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-xl text-base font-medium leading-none',
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
