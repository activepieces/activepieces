import {
  ActionType,
  Trigger,
  TriggerType,
  flowHelper,
} from '@activepieces/shared';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { piecesHooks, StepMetadata } from '../lib/pieces-hook';

import { PieceIcon } from './piece-icon';

export function PieceIconList({
  maxNumberOfIconsToShow,
  trigger,
}: {
  trigger: Trigger;
  maxNumberOfIconsToShow: number;
}) {
  const steps = flowHelper.getAllSteps(trigger);
  const stepsMetadata = piecesHooks
    .useStepsMetadata(steps)
    .map((data) => data.data)
    .filter((data) => !!data);
  const uniqueMetadata: StepMetadata[] = Array.from(
    new Map<string, StepMetadata>(
      stepsMetadata.map((item) => [
        item.type === ActionType.PIECE ? item.pieceName : item.type,
        item,
      ]),
    ).values(),
  );

  const visibleMetadata = uniqueMetadata.slice(0, maxNumberOfIconsToShow);
  const extraPieces = uniqueMetadata.length - visibleMetadata.length;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex gap-2">
          {visibleMetadata.map((metadata, index) => (
            <PieceIcon
              logoUrl={metadata.logoUrl}
              showTooltip={false}
              circle={true}
              size={'md'}
              border={true}
              displayName={metadata.displayName}
              key={index}
            />
          ))}
          {extraPieces > 0 && (
            <div className="flex items-center justify-center bg-white text-black  p-2 rounded-full border border-solid size-[36px]">
              +{extraPieces}
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {uniqueMetadata.length > 1 &&
          uniqueMetadata
            .map((m) => m?.displayName || '')
            .slice(0, -1)
            .join(', ') +
            ` and ${uniqueMetadata[uniqueMetadata.length - 1].displayName}`}
        {uniqueMetadata.length === 1 && uniqueMetadata[0].displayName}
      </TooltipContent>
    </Tooltip>
  );
}
