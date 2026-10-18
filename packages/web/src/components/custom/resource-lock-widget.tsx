import { t } from 'i18next';
import { Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function ResourceLockWidget({
  lockedBy,
  takeOver,
  className,
}: ResourceLockWidgetProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-40 border-2 border-accent-9 animate-fade duration-300',
        className,
      )}
    >
      <div
        data-theme="light"
        className="pointer-events-auto absolute top-0 left-1/2 flex h-10 max-w-[calc(100%-1rem)] -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-b-lg bg-accent-9 pl-4 pr-1.5 text-sm font-medium text-on-accent"
      >
        <Lock className="size-3.5 shrink-0" />
        <span className="min-w-0 truncate">
          {t('{name} is editing', { name: lockedBy.userDisplayName })}
          {' · '}
          {t('View only')}
        </span>
        <Button
          variant="outline"
          size="xs"
          className="h-7 shrink-0 rounded-md border-0 bg-panel px-3 font-medium text-accent-11 enabled:hover:bg-accent-3 enabled:hover:text-accent-11"
          onClick={takeOver}
        >
          {t('Take Over')}
        </Button>
      </div>
    </div>
  );
}

ResourceLockWidget.displayName = 'ResourceLockWidget';
export { ResourceLockWidget };

type ResourceLockWidgetProps = {
  lockedBy: {
    userId: string;
    userDisplayName: string;
  };
  takeOver: () => void;
  className?: string;
};
