import { ScrollArea } from '@/components/ui/scroll-area';
import {
  PieceSelectorOperation,
  StepMetadataWithSuggestions,
} from '@/lib/types';

import { convertStepMetadataToPieceSelectorItems } from '../piece-actions-or-triggers-list';

import AIActionItem from './ai-action';
import {
  getActionIcon,
  getActionVideo,
  getItemKey,
  isRunAgentAction,
} from './ai-actions-constants';
import { AIActionsFooter } from './ai-actions-footer';
import { useAIActionHandler } from './use-ai-action-handler';

type AIPieceActionsListProps = {
  hidePieceIconAndDescription: boolean;
  stepMetadataWithSuggestions: StepMetadataWithSuggestions;
  operation: PieceSelectorOperation;
};

export const AIPieceActionsList: React.FC<AIPieceActionsListProps> = ({
  stepMetadataWithSuggestions,
  hidePieceIconAndDescription,
  operation,
}) => {
  const { handleActionClick } = useAIActionHandler(operation);

  const aiActions = convertStepMetadataToPieceSelectorItems(
    stepMetadataWithSuggestions
  );

  const agentAction = aiActions.find(isRunAgentAction);
  const otherActions = aiActions.filter((item) => !isRunAgentAction(item));

  return (
    <ScrollArea className="h-full w-full" viewPortClassName="h-full">
      <div className="flex flex-col h-full p-2 gap-2 min-w-0">
        {/* Main content grid */}
        <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 min-w-0 w-full">
          {/* Left side - AI Agent card */}
          {agentAction && (
            <div className="w-full min-w-0 shrink-0">
              <AIActionItem
                item={agentAction}
                hidePieceIconAndDescription={hidePieceIconAndDescription}
                stepMetadataWithSuggestions={stepMetadataWithSuggestions}
                actionIcon={getActionIcon(agentAction)}
                actionVideo={getActionVideo(agentAction)}
                isAgent={true}
                onClick={() => handleActionClick(agentAction)}
              />
            </div>
          )}

          {/* Right side - Other actions grid */}
          <div className="grid grid-cols-1 gap-2 min-w-0 auto-rows-fr">
            {otherActions.map((item, index) => (
              <AIActionItem
                key={getItemKey(item, index)}
                item={item}
                hidePieceIconAndDescription={hidePieceIconAndDescription}
                stepMetadataWithSuggestions={stepMetadataWithSuggestions}
                actionIcon={getActionIcon(item)}
                actionVideo={getActionVideo(item)}
                isAgent={false}
                onClick={() => handleActionClick(item)}
              />
            ))}
          </div>
        </div>

        {/* Footer with available models */}
        <AIActionsFooter />
      </div>
    </ScrollArea>
  );
};
