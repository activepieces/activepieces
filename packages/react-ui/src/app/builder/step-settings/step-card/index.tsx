import React from 'react';

import { pieceSelectorUtils } from '@/app/builder/pieces-selector/piece-selector-utils';
import { PieceMetadataModel } from '@activepieces/pieces-framework';
import { Action, isNil, Trigger } from '@activepieces/shared';

import { StepMetadata } from '../../../../features/pieces/lib/types';

import { AgentCard } from './agent-card';
import { PieceCard } from './piece-card';

type StepCardInfoProps = {
  piece: StepMetadata;
  onClick?: () => void;
  step: Action | Trigger;
  pieceModel: PieceMetadataModel;
};

const StepCardInfo: React.FC<StepCardInfoProps> = ({
  piece,
  step,
  onClick,
  pieceModel,
}) => {
  const isAgentStep = pieceSelectorUtils.isAgentPiece(step as Action);
  const agentId = pieceSelectorUtils.getAgentId(step as Action);

  if (isAgentStep && !isNil(agentId)) {
    return <AgentCard step={step} onClick={onClick} agentId={agentId} />;
  }

  return (
    <PieceCard
      piece={piece}
      step={step}
      onClick={onClick}
      pieceModel={pieceModel}
    />
  );
};

export { StepCardInfo };
