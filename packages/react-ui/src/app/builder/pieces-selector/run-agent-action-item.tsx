import { CardListItemSkeleton } from "@/components/custom/card-list";
import { agentHooks } from "@/features/agents/lib/agent-hooks";
import { Agent, FlowOperationType, isNil } from "@activepieces/shared";
import GenericActionOrTriggerItem from "./generic-piece-selector-item";
import { PieceSelectorOperation, PieceSelectorPieceItem } from "@/lib/types";
import { BuilderState, useBuilderStateContext } from "../builder-hooks";
import { pieceSelectorUtils } from "@/features/pieces/lib/piece-selector-utils";


type RunAgentActionItemProps = {
    pieceSelectorItem: PieceSelectorPieceItem;
    operation: PieceSelectorOperation;
    hidePieceIconAndDescription: boolean;
};

const RunAgentActionItem = ({ pieceSelectorItem, operation, hidePieceIconAndDescription }: RunAgentActionItemProps) => {
    const { data: agentsPage, isLoading, } = agentHooks.useList();
     const [handleAddingOrUpdatingStep] = useBuilderStateContext((state)=>[state.handleAddingOrUpdatingStep])
    if (isLoading || isNil(agentsPage)) {
      return  <div className="flex flex-col gap-2">
            <CardListItemSkeleton numberOfCards={2} withCircle={false} />
          </div>
    }

    const agentPieceSelectorItems = agentsPage.data.map((agent) => ({...modifyPieceSelectorItemToRunAgent(pieceSelectorItem, agent), agent}))

    return (
        <>
        <GenericActionOrTriggerItem
            item={pieceSelectorItem}
            hidePieceIconAndDescription={hidePieceIconAndDescription}
            stepMetadataWithSuggestions={pieceSelectorItem.pieceMetadata}
            onClick={() => {
                handleAddingOrUpdatingStep({
                    pieceSelectorItem,
                    operation,
                    selectStepAfter: true,
                  })
            }}
        />
        {agentPieceSelectorItems.map((agentPieceSelectorItem) => (
            <GenericActionOrTriggerItem
                item={agentPieceSelectorItem}
                hidePieceIconAndDescription={hidePieceIconAndDescription}
                stepMetadataWithSuggestions={agentPieceSelectorItem.pieceMetadata}
                onClick={() => {
                    handleAddingOrUpdatingCustomAgentPieceSelectorItem(agentPieceSelectorItem, agentPieceSelectorItem.agent, operation, handleAddingOrUpdatingStep)
                }}
            />
        ))}
        </>
    );
};

export default RunAgentActionItem;

const modifyPieceSelectorItemToRunAgent = (pieceSelectorItem: PieceSelectorPieceItem, agent: Agent): PieceSelectorPieceItem => {
    const agentPieceSelectorItem: PieceSelectorPieceItem = JSON.parse(JSON.stringify(pieceSelectorItem))
    agentPieceSelectorItem.pieceMetadata.logoUrl = agent.profilePictureUrl
    agentPieceSelectorItem.actionOrTrigger.description = agent.description
    agentPieceSelectorItem.actionOrTrigger.displayName = agent.displayName
    return agentPieceSelectorItem
};

const handleAddingOrUpdatingCustomAgentPieceSelectorItem = (pieceSelectorItem: PieceSelectorPieceItem, agent: Agent, operation: PieceSelectorOperation, handleAddingOrUpdatingStep: BuilderState['handleAddingOrUpdatingStep']) => {
    const stepName = handleAddingOrUpdatingStep({
        pieceSelectorItem,
        operation,
        selectStepAfter: true
    })
    const defaultValues = pieceSelectorUtils.getDefaultStepValues({
        stepName,
        pieceSelectorItem
    })
    defaultValues.settings.input.agentId = agent.id
    return handleAddingOrUpdatingStep({
        pieceSelectorItem,
        operation: {
            type: FlowOperationType.UPDATE_ACTION,
            stepName,
        },
        selectStepAfter: false,
        settings: defaultValues.settings,
    })
}