import { Alert02Icon, RefreshIcon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { useState } from 'react';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
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
      <div className="flex size-10 items-center justify-center rounded-xl bg-warning-3 text-warning-11">
        <HugeiconsIcon icon={Alert02Icon} className="size-5" />
      </div>
      <p className="text-lg font-semibold">
        {t('Trouble loading {entity}', { entity })}
      </p>
      <p className="max-w-sm text-sm text-gray-11">
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
          <HugeiconsIcon icon={RefreshIcon} className="size-4" />
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
