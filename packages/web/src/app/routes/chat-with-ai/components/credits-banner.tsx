import { t } from 'i18next';
import { AlertTriangle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { CreditsWarning } from '@/features/chat/lib/chat-types';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { cn } from '@/lib/utils';

export function CreditsBanner({
  creditsExhausted,
  creditsWarning,
  daysUntilReset,
  onDismiss,
}: {
  creditsExhausted?: boolean;
  creditsWarning?: CreditsWarning | null;
  daysUntilReset?: number | null;
  onDismiss?: () => void;
}) {
  const isPlatformAdmin = useIsPlatformAdmin();
  const isError = Boolean(creditsExhausted);

  const message = isError
    ? daysUntilReset != null
      ? t("You've reached your credits limit. Resets in {days} days.", {
          days: daysUntilReset,
        })
      : t("You've reached your credits limit.")
    : daysUntilReset != null
    ? t("You've used {percentage}% of your credits. Resets in {days} days.", {
        percentage: creditsWarning?.percentage,
        days: daysUntilReset,
      })
    : t("You've used {percentage}% of your credits.", {
        percentage: creditsWarning?.percentage,
      });

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 text-sm',
        isError
          ? 'bg-destructive/5 text-destructive'
          : 'bg-warning/5 text-warning',
      )}
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1">{message}</span>
      {isPlatformAdmin && (
        <Link
          to="/platform/setup/billing"
          className="shrink-0 text-sm font-medium underline"
        >
          {t('Show Usage')}
        </Link>
      )}
      {!isError && (
        <Button
          variant="ghost"
          size="sm"
          className="text-warning hover:text-warning shrink-0 h-6 w-6 p-0"
          onClick={onDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
