import { cva } from 'class-variance-authority';

import { flowHelper, Trigger } from '@activepieces/shared';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { piecesHooks, StepMetadata } from '../lib/pieces-hook';

import { PieceIcon } from './piece-icon';

const extraIconVariants = cva(
  'flex items-center justify-center bg-white text-black  p-2 rounded-full border border-solid',
  {
    variants: {
      size: {
        xl: 'size-[64px]',
        lg: 'size-[48px]',
        md: 'size-[36px]',
        sm: 'size-[25px]',
      },
    },
    defaultVariants: {},
  },
);

export function PieceIconList({
  maxNumberOfIconsToShow,
  trigger,
  size,
}: {
  trigger: Trigger;
  maxNumberOfIconsToShow: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const steps = flowHelper.getAllSteps(trigger);
  const stepsMetadata: StepMetadata[] = piecesHooks
    .useStepsMetadata(steps)
    .map((data) => data.data)
    .filter((data) => !!data) as StepMetadata[];

  const uniqueMetadata: StepMetadata[] = stepsMetadata.filter(
    (item, index, self) => self.indexOf(item) === index,
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
              size={size ?? 'md'}
              border={true}
              displayName={metadata.displayName}
              key={index}
            />
          ))}
          {extraPieces > 0 && (
            <div className={extraIconVariants({ size: size ?? 'md' })}>
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
