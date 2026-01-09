import { cva } from 'class-variance-authority';
import { t } from 'i18next';

import {
  FlowTrigger,
  flowStructureUtil,
  PieceCategory,
} from '@activepieces/shared';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { PieceStepMetadata, StepMetadata } from '../../../lib/types';
import { stepsHooks } from '../lib/steps-hooks';

import { PieceIcon } from './piece-icon';

const extraIconVariants = cva(
  'flex items-center justify-center p-2 rounded-full border border-solid text-xs select-none',
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
  className,
  circle = true,
  background,
  shadow,
  excludeCore = false,
}: {
  trigger: FlowTrigger;
  maxNumberOfIconsToShow: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
  circle?: boolean;
  background?: string;
  shadow?: boolean;
  excludeCore?: boolean;
}) {
  const steps = flowStructureUtil.getAllSteps(trigger);
  const stepsMetadata: StepMetadata[] = stepsHooks
    .useStepsMetadata(steps)
    .map((data) => data.data)
    .filter((data) => !!data) as StepMetadata[];

  const filteredMetadata = excludeCore
    ? stepsMetadata.filter((metadata) => {
        const pieceMetadata = metadata as PieceStepMetadata;
        return (
          !pieceMetadata.categories ||
          !pieceMetadata.categories.includes(PieceCategory.CORE)
        );
      })
    : stepsMetadata;

  const uniqueMetadata: StepMetadata[] = filteredMetadata.filter(
    (item, index, self) =>
      self.findIndex(
        (secondItem) => item.displayName === secondItem.displayName,
      ) === index,
  );
  const visibleMetadata = uniqueMetadata.slice(0, maxNumberOfIconsToShow);
  const extraPieces = uniqueMetadata.length - visibleMetadata.length;
  const extraMetadata = uniqueMetadata.slice(maxNumberOfIconsToShow);

  return (
    <div className={className || 'flex gap-0.5 '}>
      {visibleMetadata.map((metadata) => (
        <PieceIcon
          logoUrl={metadata.logoUrl}
          showTooltip={true}
          circle={circle}
          size={size ?? 'md'}
          border={true}
          displayName={metadata.displayName}
          key={metadata.logoUrl}
          background={background}
        />
      ))}
      {extraPieces > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={extraIconVariants({ size: size ?? 'md' })}>
              +{extraPieces}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {extraMetadata.length > 1 &&
              extraMetadata
                .map((m) => m?.displayName || '')
                .slice(0, -1)
                .join(', ') +
                ` ${t('and')} ${
                  extraMetadata[extraMetadata.length - 1].displayName
                }`}
            {extraMetadata.length === 1 && extraMetadata[0].displayName}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
