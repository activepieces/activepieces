import React from 'react';

import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { Action, ActionType, isNil, Trigger, TriggerType } from '@activepieces/shared';

import { BaseCard } from './base-card';
import { PieceStepMetadata, StepMetadata } from '../../../../features/pieces/lib/types';
import { PieceMetadataModel } from '@activepieces/pieces-framework';

type PieceCardProps = {
  piece: StepMetadata;
  onClick?: () => void;
  step: Action | Trigger;
  pieceModel: PieceMetadataModel;
};

const PieceCard: React.FC<PieceCardProps> = ({
  piece,
  step,
  onClick,
  pieceModel,
}) => {
  const actionOrTriggerDisplayName = getPieceDisplayName(step, pieceModel);
  const customizedInputs = step.settings.customizedInputs;
  const isPiece =
    piece.type === ActionType.PIECE || piece.type === TriggerType.PIECE;
  const logoUrl = customizedInputs?.logoUrl ?? piece.logoUrl;
  const description = customizedInputs?.description ?? piece.description;

  const pieceImage = (
    <PieceIcon
      logoUrl={logoUrl}
      displayName={piece.displayName}
      showTooltip={false}
      border={false}
      size={'xl'}
    />
  );

  const title = `${piece.displayName}${actionOrTriggerDisplayName ? ` (${actionOrTriggerDisplayName})` : ''}`;
  const version = isPiece ? (piece as PieceStepMetadata).pieceVersion : undefined;

  return (
    <BaseCard
      image={pieceImage}
      title={title}
      description={description}
      onClick={onClick}
      version={version}
    />
  );
};

function getPieceDisplayName(step: Action | Trigger, pieceModel: PieceMetadataModel) {
  if (!isNil(step.settings.actionName)) {
    return pieceModel?.actions[step.settings.actionName]?.displayName;
  }
  if (!isNil(step.settings.triggerName)) {
    return pieceModel?.triggers[step.settings.triggerName]?.displayName;
  }
  return null;
}

export { PieceCard }; 