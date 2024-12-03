import { cva } from 'class-variance-authority';
import { t } from 'i18next';

import { Trigger, flowStructureUtil } from '@activepieces/shared';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { piecesHooks } from '../lib/pieces-hook';
import { StepMetadata } from '../lib/types';

import { PieceIcon } from './piece-icon';

const extraIconVariants = cva(
  'flex items-center justify-center bg-accent/35 text-accent-foreground  p-2 rounded-full border border-solid dark:bg-accent-foreground/25 dark:text-foreground select-none',
  {
    variants: {
      size: {
        xxl: 'size-[64px]',
        xl: 'size-[48px]',
        lg: 'size-[40px]',
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
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
}) {
  const steps = flowStructureUtil.getAllSteps(trigger);
  const stepsMetadata: StepMetadata[] = piecesHooks
    .useStepsMetadata(steps)
    .map((data) => data.data)
    .filter((data) => !!data) as StepMetadata[];

  const uniqueMetadata: StepMetadata[] = stepsMetadata.filter(
    (item, index, self) =>
      self.findIndex(
        (secondItem) => item.displayName === secondItem.displayName,
      ) === index,
  );
  const visibleMetadata = uniqueMetadata.slice(0, maxNumberOfIconsToShow);
  const extraPieces = uniqueMetadata.length - visibleMetadata.length;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex gap-2">
          {visibleMetadata.map((metadata) => (
            <PieceIcon
              logoUrl={metadata.logoUrl}
              showTooltip={false}
              circle={true}
              size={size ?? 'md'}
              border={true}
              displayName={metadata.displayName}
              key={metadata.logoUrl}
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
            ` ${t('and')} ${
              uniqueMetadata[uniqueMetadata.length - 1].displayName
            }`}
        {uniqueMetadata.length === 1 && uniqueMetadata[0].displayName}
      </TooltipContent>
    </Tooltip>
  );
}
