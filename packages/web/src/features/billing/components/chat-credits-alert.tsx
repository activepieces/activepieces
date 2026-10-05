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
        isError ? 'bg-danger-3 text-danger-11' : 'bg-warning-3 text-warning-11',
      )}
    >
      <AlertTriangle className="size-3.5 shrink-0" />
      <span className="flex-1">{message}</span>
      <CreditsActionButton className="shrink-0" variant="default" />
      {!isError && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="shrink-0 text-warning-11 hover:text-warning-11"
          onClick={onDismiss}
        >
          <X />
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
