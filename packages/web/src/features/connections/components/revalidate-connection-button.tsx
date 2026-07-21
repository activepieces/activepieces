import { t } from 'i18next';
import { RefreshCw } from 'lucide-react';

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
          <RefreshCw className={cn('size-4', { 'animate-spin': isPending })} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t('Recheck connection')}</TooltipContent>
    </Tooltip>
  );
};
