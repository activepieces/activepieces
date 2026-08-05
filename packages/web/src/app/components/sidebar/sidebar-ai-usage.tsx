import { t } from 'i18next';
import { Info } from 'lucide-react';

import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

export function SidebarAiUsage({
  used,
  limit,
}: {
  used: number;
  limit: number | null;
}) {
  const ratio = limit === null ? 0 : Math.min(used / limit, 1);
  const reached = limit !== null && used >= limit;

  return (
    <div className="flex flex-col w-full gap-1.5 p-2.5 bg-background rounded-md border">
      <div className="flex items-center justify-between gap-2 w-full text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">•</span>
          <span className="truncate font-medium">{t('AI Usage')}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="size-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px]">
              <p className="text-sm">
                {t(
                  'AI credits used by this project across chat, agents, and AI steps.',
                )}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <span className={cn({ 'text-destructive font-medium': reached })}>
          {formatUtils.formatNumber(used)} /{' '}
          {limit === null ? t('Unlimited') : formatUtils.formatNumber(limit)}
        </span>
      </div>
      {limit !== null && (
        <Progress
          value={ratio * 100}
          className={cn('h-1.5', { '[&>div]:bg-destructive': reached })}
        />
      )}
      {reached && (
        <p className="text-xs text-destructive">
          {t('AI limit reached — further AI requests are blocked.')}
        </p>
      )}
    </div>
  );
}
