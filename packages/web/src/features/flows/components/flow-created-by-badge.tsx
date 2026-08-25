import { FlowCreator, FlowCreatorType } from '@activepieces/shared';
import { t } from 'i18next';

import { McpSvg } from '@/assets/img/custom/mcp';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type FlowCreatedByBadgeProps = {
  createdBy: FlowCreator | null | undefined;
  className?: string;
};

export const FlowCreatedByBadge = ({
  createdBy,
  className,
}: FlowCreatedByBadgeProps) => {
  if (!createdBy || createdBy.type !== FlowCreatorType.MCP) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex h-5 items-center gap-1 rounded-md border border-border bg-muted px-[5px] text-xs font-bold leading-none text-muted-foreground',
            className,
          )}
        >
          <McpSvg className="h-3 w-3" />
          {t('AI')}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{t('Created by AI')}</TooltipContent>
    </Tooltip>
  );
};
