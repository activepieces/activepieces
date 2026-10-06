import { RefreshIcon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { appConnectionsMutations } from '../hooks/app-connections-hooks';

type RevalidateConnectionButtonProps = {
  connectionId: string;
};

export const RevalidateConnectionButton = ({
  connectionId,
}: RevalidateConnectionButtonProps) => {
  const { mutate, isPending } =
    appConnectionsMutations.useRevalidateConnection();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('Recheck connection')}
          disabled={isPending}
          onClick={() => mutate(connectionId)}
        >
          <HugeiconsIcon
            icon={RefreshIcon}
            className={cn('size-4', { 'animate-spin': isPending })}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t('Recheck connection')}</TooltipContent>
    </Tooltip>
  );
};
