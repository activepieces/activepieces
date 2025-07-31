import { CardListItemSkeleton } from '@/components/custom/card-list';
import { agentHooks } from '@/features/agents/lib/agent-hooks';
import { PieceSelectorOperation, PieceSelectorPieceItem } from '@/lib/types';
import { isNil } from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

import CreateAgentActionItem from './create-agent-action-item';
import {
  handleAddingOrUpdatingCustomAgentPieceSelectorItem,
  overrideDisplayInfoForPieceSelectorItemWithAgentInfo,
} from './custom-piece-selector-items-utils';
import GenericActionOrTriggerItem from './generic-piece-selector-item';

type RunAgentActionItemProps = {
  pieceSelectorItem: PieceSelectorPieceItem;
  operation: PieceSelectorOperation;
  hidePieceIconAndDescription: boolean;
};

const RunAgentActionItem = ({
  pieceSelectorItem,
  operation,
  hidePieceIconAndDescription,
}: RunAgentActionItemProps) => {
  const { data: agentsPage, isLoading } = agentHooks.useList();
  const [handleAddingOrUpdatingStep] = useBuilderStateContext((state) => [
    state.handleAddingOrUpdatingStep,
  ]);
  if (isLoading || isNil(agentsPage)) {
    return (
      <div className="flex flex-col gap-2">
        <CardListItemSkeleton numberOfCards={2} withCircle={false} />
      </div>
    );
  }

  const agentPieceSelectorItems = agentsPage.data.map((agent) => ({
    ...overrideDisplayInfoForPieceSelectorItemWithAgentInfo(
      pieceSelectorItem,
      agent,
    ),
    agent,
  }));

  return (
    <>
      <CreateAgentActionItem
        pieceSelectorItem={pieceSelectorItem}
        operation={operation}
        hidePieceIconAndDescription={hidePieceIconAndDescription}
      />
      {agentPieceSelectorItems.map((agentPieceSelectorItem) => (
        <GenericActionOrTriggerItem
          key={agentPieceSelectorItem.agent.id}
          item={agentPieceSelectorItem}
          hidePieceIconAndDescription={hidePieceIconAndDescription}
          stepMetadataWithSuggestions={agentPieceSelectorItem.pieceMetadata}
          onClick={() => {
            handleAddingOrUpdatingCustomAgentPieceSelectorItem(
              agentPieceSelectorItem,
              agentPieceSelectorItem.agent,
              operation,
              handleAddingOrUpdatingStep,
            );
          }}
        />
      ))}
    </>
  );
};

export default RunAgentActionItem;
