import { t } from 'i18next';
import React from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FlowVersionState } from '@activepieces/shared';

type FlowVersionStateProps = {
  state: FlowVersionState;
};

const FlowVersionStateDot = React.memo(({ state }: FlowVersionStateProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="size-10 flex justify-center items-center">
          {state === FlowVersionState.DRAFT && (
            <span className="bg-warning size-1.5 rounded-full"></span>
          )}
          {state === FlowVersionState.LOCKED && (
            <span className="bg-success size-1.5 rounded-full"></span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {state === FlowVersionState.DRAFT
          ? t('Draft Version')
          : t('Locked Version')}
      </TooltipContent>
    </Tooltip>
  );
});

FlowVersionStateDot.displayName = 'FlowVersionStateDot';
export { FlowVersionStateDot };
