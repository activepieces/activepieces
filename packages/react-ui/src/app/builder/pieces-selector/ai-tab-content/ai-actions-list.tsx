import { t } from 'i18next';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useTelemetry } from '@/components/telemetry-provider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { flagsHooks } from '@/hooks/flags-hooks';
import {
  PieceSelectorOperation,
  StepMetadataWithSuggestions,
} from '@/lib/types';
import {
  ApFlagId,
  FlowActionType,
  TelemetryEventName,
} from '@activepieces/shared';

import { usePieceSearchContext } from '../../../../features/pieces/lib/piece-search-context';
import { useBuilderStateContext } from '../../builder-hooks';
import { convertStepMetadataToPieceSelectorItems } from '../piece-actions-or-triggers-list';

import AIActionItem from './ai-action';

type AIPieceActionsListProps = {
  hidePieceIconAndDescription: boolean;
  stepMetadataWithSuggestions: StepMetadataWithSuggestions;
  operation: PieceSelectorOperation;
};

const ACTION_ICON_MAP: Record<string, string> = {
  run_agent: 'https://cdn.activepieces.com/pieces/ai/native/ai-agents.mp4',
  generateImage: 'https://cdn.activepieces.com/pieces/ai/native/generate-images.mp4',
  askAi: 'https://cdn.activepieces.com/pieces/ai/native/ask-ai.mp4',
  summarizeText: 'https://cdn.activepieces.com/pieces/ai/native/summarize-text.mp4',
  classifyText: 'https://cdn.activepieces.com/pieces/ai/native/classify-text.mp4',
  extractStructuredData: 'https://cdn.activepieces.com/pieces/ai/native/ocr.mp4',
};

const getPieceSelectorItemInfo = (item: any) => {
  if (
    item.type === FlowActionType.PIECE ||
    item.type === 'PIECE_TRIGGER'
  ) {
    return {
      displayName: item.actionOrTrigger.displayName,
      description: item.actionOrTrigger.description,
    };
  }
  return {
    displayName: item.displayName,
    description: item.description,
  };
};

export const AIPieceActionsList: React.FC<AIPieceActionsListProps> = ({
  stepMetadataWithSuggestions,
  hidePieceIconAndDescription,
  operation,
}) => {
  const { capture } = useTelemetry();
  const { searchQuery } = usePieceSearchContext();
  const [handleAddingOrUpdatingStep] = useBuilderStateContext((state) => [
    state.handleAddingOrUpdatingStep,
  ]);
  const { data: isAgentsConfigured } = flagsHooks.useFlag<boolean>(
    ApFlagId.AGENTS_CONFIGURED,
  );
  const navigate = useNavigate();
  const [isAgentHovered, setIsAgentHovered] = React.useState(false);

  const aiActions = convertStepMetadataToPieceSelectorItems(
    stepMetadataWithSuggestions,
  );
// ... existing separate logic ...
  const agentAction = aiActions.find(
    (item) =>
      item.type === FlowActionType.PIECE &&
      item.actionOrTrigger.name === 'run_agent',
  );
// ... existing filter logic ...
  const otherActions = aiActions.filter(
    (item) =>
      !(
        item.type === FlowActionType.PIECE &&
        item.actionOrTrigger.name === 'run_agent'
      ),
  );

  const handleClick = (item: any) => {
// ... existing handleClick ...
    if (!isAgentsConfigured) {
      toast('Connect to OpenAI', {
        description: t(
          "To create an agent, you'll first need to connect to OpenAI in platform settings.",
        ),
        action: {
          label: 'Set Up',
          onClick: () => {
            navigate('/platform/setup/ai');
          },
        },
      });
      return;
    }

    if (item.type === FlowActionType.PIECE) {
      capture({
        name: TelemetryEventName.PIECE_SELECTOR_SEARCH,
        payload: {
          search: searchQuery,
          isTrigger: false,
          selectedActionOrTriggerName: item.actionOrTrigger.name,
        },
      });
    }
    handleAddingOrUpdatingStep({
      pieceSelectorItem: item,
      operation,
      selectStepAfter: true,
    });
  };

  return (
    <div className="flex flex-col px-4">
      <div className="flex gap-4 pt-4 pb-0 w-full">
        {/* Left: Featured AI Agent Card */}
        {agentAction && (
          <div className="w-[45%] flex-shrink-0">
            <div
              onClick={() => handleClick(agentAction)}
              onMouseEnter={() => setIsAgentHovered(true)}
              onMouseLeave={() => setIsAgentHovered(false)}
              className="group relative flex flex-col rounded-xl bg-transparent border border-transparent cursor-pointer hover:bg-accent/50 hover:border-border transition-all duration-200 overflow-hidden h-[428px]"
            >
              {/* Image Section - Aligns with 3 cards + 3 gaps on the right */}
              <div className="p-1 h-[252px]">
                <div className="w-full h-full relative rounded-xl overflow-hidden border border-transparent group-hover:border-border transition-all duration-200">
                  <PieceIcon
                    logoUrl={ACTION_ICON_MAP['run_agent']}
                    displayName="AI Agent"
                    showTooltip={false}
                    playOnHover={true}
                    forcePlay={isAgentHovered}
                  />
                </div>
              </div>

              {/* Content Section - Aligns with bottom 2 cards on the right */}
              <div className="px-5 pb-4 pt-3 flex flex-col h-[176px]">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold tracking-tight text-foreground">
                    AI Agent
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {getPieceSelectorItemInfo(agentAction).description}
                  </p>
                </div>

                {/* Add link at bottom right */}
                <div className="mt-auto flex justify-end">
                  <span className="text-sm font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Add
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right: Other Actions List */}
        <div className="flex-1 flex flex-col gap-3">
          {otherActions.map((item, index) => {
            const actionIcon =
              item.type === FlowActionType.PIECE
                ? ACTION_ICON_MAP[item.actionOrTrigger.name]
                : 'https://cdn.activepieces.com/pieces/image-ai.svg';
            return (
              <AIActionItem
                key={index}
                item={item}
                hidePieceIconAndDescription={hidePieceIconAndDescription}
                stepMetadataWithSuggestions={{
                  ...stepMetadataWithSuggestions,
                  logoUrl: actionIcon,
                }}
                onClick={() => handleClick(item)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
