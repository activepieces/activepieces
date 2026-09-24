import { cn } from '@/lib/utils';

export function SectionHeader({
  title,
  count,
  description,
  isPageTitle = false,
}: {
  title: string;
  count?: number;
  description: string;
  isPageTitle?: boolean;
}) {
  const Heading = isPageTitle ? 'h1' : 'h2';
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <Heading
          className={cn('font-semibold tracking-tight', {
            'text-lg': isPageTitle,
            'text-base': !isPageTitle,
          })}
        >
          {title}
        </Heading>
        {count !== undefined && (
          <span className="text-sm text-muted-foreground tabular-nums">
            {count}
          </span>
        )}
      </div>
      <p
        className={cn('text-muted-foreground', {
          'text-xs': isPageTitle,
          'text-sm': !isPageTitle,
        })}
      >
        {description}
      </p>
    </div>
  );
}
