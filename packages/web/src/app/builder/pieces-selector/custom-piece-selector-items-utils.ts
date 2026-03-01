import { FlowOperationType } from '@activepieces/shared';

import { pieceSelectorUtils } from '@/features/pieces/lib/piece-selector-utils';
import { PieceSelectorOperation, PieceSelectorPieceItem } from '@/lib/types';

import { BuilderState } from '../builder-hooks';

export const handleAddingOrUpdatingCustomAgentPieceSelectorItem = (
  agentPieceSelectorItem: PieceSelectorPieceItem,
  operation: PieceSelectorOperation,
  handleAddingOrUpdatingStep: BuilderState['handleAddingOrUpdatingStep'],
) => {
  const stepName = handleAddingOrUpdatingStep({
    pieceSelectorItem: agentPieceSelectorItem,
    operation,
    selectStepAfter: true,
  });
  const defaultValues = pieceSelectorUtils.getDefaultStepValues({
    stepName,
    pieceSelectorItem: agentPieceSelectorItem,
  });
  return handleAddingOrUpdatingStep({
    pieceSelectorItem: agentPieceSelectorItem,
    operation: {
      type: FlowOperationType.UPDATE_ACTION,
      stepName,
    },
    selectStepAfter: false,
    overrideSettings: defaultValues.settings,
  });
};
