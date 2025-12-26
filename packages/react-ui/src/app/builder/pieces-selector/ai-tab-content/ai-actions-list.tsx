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

  const aiActions = convertStepMetadataToPieceSelectorItems(
    stepMetadataWithSuggestions,
  );

  // Separate AI Agent from other actions
  const agentAction = aiActions.find(
    (item) =>
      item.type === FlowActionType.PIECE &&
      item.actionOrTrigger.name === 'run_agent',
  );
  const otherActions = aiActions.filter(
    (item) =>
      !(
        item.type === FlowActionType.PIECE &&
        item.actionOrTrigger.name === 'run_agent'
      ),
  );

  const handleClick = (item: any) => {
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
    <ScrollArea className="h-full" viewPortClassName="h-full">
      <div className="flex gap-4 p-4 w-full">
        {/* Left: Featured AI Agent Card */}
        {agentAction && (
          <div className="w-[45%] flex-shrink-0">
            <div
              onClick={() => handleClick(agentAction)}
              className="group relative h-full min-h-[380px] rounded-2xl bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-purple-900/40 dark:via-pink-900/40 dark:to-blue-900/40 p-6 cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden border border-purple-200/50 dark:border-purple-700/50"
            >
              {/* Large centered icon */}
              <div className="flex items-center justify-center mb-6 mt-8">
                <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-purple-200/80 via-pink-200/80 to-blue-200/80 dark:from-purple-800/60 dark:via-pink-800/60 dark:to-blue-800/60 flex items-center justify-center p-8 shadow-lg">
                  <PieceIcon
                    logoUrl={ACTION_ICON_MAP['run_agent']}
                    displayName="AI Agent"
                    showTooltip={false}
                    size={'xxl'}
                    playOnHover={true}
                  />
                </div>
              </div>

              {/* Title and Description */}
              <div className="text-center space-y-3">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">
                  AI Agent
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {getPieceSelectorItemInfo(agentAction).description}
                </p>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
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
    </ScrollArea>
  );
};
