import { Trigger, flowHelper } from '@activepieces/shared';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { piecesHooks } from '../lib/pieces-hook';

import { PieceIcon } from './piece-icon';

export function PieceIconList({
  maxNumberOfIconsToShow,
  trigger,
}: {
  trigger: Trigger;
  maxNumberOfIconsToShow: number;
}) {
  const steps = flowHelper.getAllSteps(trigger).map((step) => ({ step }));
  const stepsMetadata = piecesHooks
    .useStepsMetadata(steps)
    .map((data) => data.data)
    .filter((data) => !!data);

  const flowPiecesMetadata = [
    ...new Map(stepsMetadata.map((item) => [item['pieceName'], item])).values(),
  ];

  const visibleMetadata = flowPiecesMetadata.slice(0, maxNumberOfIconsToShow);
  const extraPieces = flowPiecesMetadata.length - visibleMetadata.length;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex gap-2">
          {visibleMetadata.map((metadata, index) => (
            <PieceIcon
              logoUrl={metadata?.logoUrl || ''}
              showTooltip={false}
              circle={true}
              size={'md'}
              border={true}
              displayName={metadata?.displayName || ''}
              key={index}
            />
          ))}
          {extraPieces > 0 && (
            <div className="flex items-center justify-center bg-accent p-2 rounded-full border border-solid size-[36px]">
              +{extraPieces}
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {flowPiecesMetadata.length > 1 &&
          flowPiecesMetadata
            .map((m) => m?.displayName || '')
            .slice(0, -1)
            .join(', ') +
            ` and ${
              flowPiecesMetadata[flowPiecesMetadata.length - 1].displayName
            }`}
        {flowPiecesMetadata.length === 1 && flowPiecesMetadata[0].displayName}
      </TooltipContent>
    </Tooltip>
  );
}
