import { t } from 'i18next';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
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
    <Empty className={cn('px-4 py-10', className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-warning-3 text-warning-11">
          <TriangleAlert />
        </EmptyMedia>
        <EmptyTitle>{t('Trouble loading {entity}', { entity })}</EmptyTitle>
        <EmptyDescription>
          {t(
            'Nothing has been lost — your data is safe. Try again in a moment.',
          )}
        </EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button
            variant="outline"
            size="sm"
            loading={isRetrying}
            onClick={handleRetry}
          >
            <RefreshCw />
            {t('Try again')}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

type DataFetchErrorStateProps = {
  entity: string;
  onRetry?: () => unknown;
  className?: string;
};
