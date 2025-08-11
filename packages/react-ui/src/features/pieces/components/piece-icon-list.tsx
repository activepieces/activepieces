import { cva } from 'class-variance-authority';
import { t } from 'i18next';

import { FlowTrigger, flowStructureUtil } from '@activepieces/shared';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { StepMetadata } from '../../../lib/types';
import { stepsHooks } from '../lib/steps-hooks';

import { PieceIcon } from './piece-icon';

const extraIconVariants = cva(
  'flex items-center justify-center p-2 rounded-full border border-solid  select-none',
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
  trigger: FlowTrigger;
  maxNumberOfIconsToShow: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
}) {
  const steps = flowStructureUtil.getAllSteps(trigger);
  const stepsMetadata: StepMetadata[] = stepsHooks
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
