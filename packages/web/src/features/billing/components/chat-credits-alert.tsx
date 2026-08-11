import { t } from 'i18next';
import { AlertTriangle, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { cn } from '@/lib/utils';

import { CreditsActionButton } from './credits-action-button';

export function ChatCreditsAlert({
  creditsExhausted,
  creditsPercentUsed,
  onDismiss,
}: ChatCreditsAlertProps) {
  const isPlatformAdmin = useIsPlatformAdmin();
  const isError = Boolean(creditsExhausted);

  const message = isError
    ? isPlatformAdmin
      ? t("You've reached your credits limit.")
      : t(
          "You've reached your credits limit. Contact a platform admin to get more credits.",
        )
    : t("You've used {percentage}% of your credits.", {
        percentage: creditsPercentUsed ?? 0,
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
      <CreditsActionButton className="shrink-0" variant="accent" />
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

type ChatCreditsAlertProps = {
  creditsExhausted?: boolean;
  creditsPercentUsed?: number | null;
  onDismiss?: () => void;
};
