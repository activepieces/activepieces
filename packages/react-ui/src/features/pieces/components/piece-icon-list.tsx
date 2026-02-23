import {
  FlowTrigger,
  FlowActionType,
  flowStructureUtil,
  PieceCategory,
} from '@activepieces/shared';
import { cva } from 'class-variance-authority';
import { t } from 'i18next';
import { useMemo } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { StepMetadata } from '../../../lib/types';
import { piecesHooks } from '../lib/pieces-hooks';
import { extractPieceNamesAndCoreMetadata } from '../lib/step-utils';

import { PieceIcon } from './piece-icon';

const extraIconVariants = cva(
  'flex items-center justify-center  bg-background border border-solid text-xs select-none',
  {
    variants: {
      size: {
        xxl: 'size-[64px]',
        xl: 'size-[48px]',
        lg: 'size-[40px]',
        md: 'size-[38px]',
        sm: 'size-[25px]',
      },
      circle: {
        true: 'rounded-full',
        false: 'rounded-md',
      },
    },
  },
);

export function PieceIconList({
  maxNumberOfIconsToShow,
  trigger,
  size,
  className,
  circle = true,
  background,
  excludeCore = false,
}: {
  trigger: FlowTrigger;
  maxNumberOfIconsToShow: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
  circle?: boolean;
  background?: string;
  excludeCore?: boolean;
}) {
  const steps = flowStructureUtil.getAllSteps(trigger);

  const { pieceNames, coreMetadata } = useMemo(
    () => extractPieceNamesAndCoreMetadata(steps, excludeCore),
    [steps, excludeCore],
  );

  const pieceQueries = piecesHooks.useMultiplePieces({ names: pieceNames });

  const stepsMetadata: StepMetadata[] = useMemo(() => {
    const pieceMetadata: StepMetadata[] = pieceQueries
      .map((q) => q.data)
      .filter((data): data is NonNullable<typeof data> => !!data)
      .filter(
        (piece) =>
          !excludeCore ||
          !piece.categories?.includes(PieceCategory.CORE),
      )
      .map((piece) => ({
        displayName: piece.displayName,
        logoUrl: piece.logoUrl,
        description: piece.description,
        type: FlowActionType.PIECE as const,
        pieceType: piece.pieceType,
        pieceName: piece.name,
        pieceVersion: piece.version,
        categories: piece.categories ?? [],
        packageType: piece.packageType,
        auth: piece.auth,
      }));
    return [...coreMetadata, ...pieceMetadata];
  }, [pieceQueries.map((q) => q.dataUpdatedAt).join(','), coreMetadata]);

  const uniqueMetadata: StepMetadata[] = stepsMetadata.filter(
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
          key={metadata.displayName}
          background={background}
        />
      ))}
      {extraPieces > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={extraIconVariants({ size: size ?? 'md', circle })}>
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


