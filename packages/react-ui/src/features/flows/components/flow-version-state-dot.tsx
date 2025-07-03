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
  publishedVersionId?: string;
  versionId: string;
};

const findVersionStateName: (
  state: FlowVersionStateProps,
) => 'Draft' | 'Published' | 'Locked' = ({
  state,
  publishedVersionId,
  versionId,
}) => {
  if (state === FlowVersionState.DRAFT) {
    return 'Draft';
  }
  if (publishedVersionId === versionId) {
    return 'Published';
  }
  return 'Locked';
};
const FlowVersionStateDot = React.memo((state: FlowVersionStateProps) => {
  const stateName = findVersionStateName(state);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="size-10 flex justify-center items-center">
          {stateName === 'Draft' && (
            <span className="bg-warning size-1.5 rounded-full"></span>
          )}
          {stateName === 'Published' && (
            <span className="bg-success size-1.5 rounded-full"></span>
          )}
          {stateName === 'Locked' && (
            <span className="bg-foreground/45 size-1.5 rounded-full"></span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {stateName === 'Draft' && t('Draft Version')}
        {stateName === 'Published' && t('Published Version')}
        {stateName === 'Locked' && t('Locked Version')}
      </TooltipContent>
    </Tooltip>
  );
});

FlowVersionStateDot.displayName = 'FlowVersionStateDot';
export { FlowVersionStateDot };
