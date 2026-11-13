import { t } from 'i18next';
import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function GrantsLoadError({
  className,
  onRetry,
}: {
  className?: string;
  onRetry: () => void;
}) {
  return (
    <span
      className={cn('flex items-center gap-1 text-sm text-gray-11', className)}
    >
      {t("Couldn't load your connections.")}
      <Button
        variant="link"
        size="sm"
        className="h-auto px-1"
        onClick={onRetry}
      >
        <RefreshCw />
        {t('Try again')}
      </Button>
    </span>
  );
}
