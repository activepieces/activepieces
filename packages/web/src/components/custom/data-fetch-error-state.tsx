import { t } from 'i18next';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function DataFetchErrorState({
  entity,
  onRetry,
  className,
}: DataFetchErrorStateProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) {
      return;
    }
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center gap-2 px-4 py-10 text-center',
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-xl bg-warning/15 text-warning-700 dark:text-warning-300">
        <TriangleAlert className="size-5" />
      </div>
      <p className="text-lg font-semibold">
        {t('Trouble loading {entity}', { entity })}
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {t('Nothing has been lost — your data is safe. Try again in a moment.')}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          loading={isRetrying}
          onClick={handleRetry}
        >
          <RefreshCw className="size-4" />
          {t('Try again')}
        </Button>
      )}
    </div>
  );
}

type DataFetchErrorStateProps = {
  entity: string;
  onRetry?: () => unknown;
  className?: string;
};
