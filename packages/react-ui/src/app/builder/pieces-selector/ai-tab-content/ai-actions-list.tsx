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
    <div className="flex flex-col px-4">
      <div className="flex gap-4 py-4 w-full">
        {/* Left: Featured AI Agent Card */}
        {agentAction && (
          <div className="w-[48%] flex-shrink-0">
            <div
              onClick={() => handleClick(agentAction)}
              className="group relative flex flex-col h-full min-h-[400px] rounded-xl bg-[#f8f8f8] dark:bg-zinc-900 border border-zinc-100/50 dark:border-zinc-800 cursor-pointer hover:bg-[#f2f2f2] dark:hover:bg-zinc-800/80 transition-all duration-200 overflow-hidden"
            >
              {/* Image Section */}
              <div className="w-full aspect-[16/11] relative">
                <PieceIcon
                  logoUrl={ACTION_ICON_MAP['run_agent']}
                  displayName="AI Agent"
                  showTooltip={false}
                  size={'full'}
                  playOnHover={true}
                />
              </div>

              {/* Content Section */}
              <div className="px-6 pb-6 pt-5 flex flex-col gap-2">
                <div className="space-y-1">
                  <h3 className="text-[19px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    AI Agent
                  </h3>
                  <p className="text-[14px] text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-3">
                    {getPieceSelectorItemInfo(agentAction).description}
                  </p>
                </div>

                {/* Add link at bottom right */}
                <div className="flex justify-end mt-2">
                  <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200 uppercase tracking-wider">
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

      {/* Footer: Available Models */}
      <div className="pt-2 pb-8 flex items-center gap-3">
        <span className="text-[13px] text-zinc-400 dark:text-zinc-500 font-medium">
          Available models:
        </span>
        <div className="flex items-center gap-2.5">
          <img
            src="https://cdn.activepieces.com/pieces/google-gemini.svg"
            alt="Gemini"
            className="w-5 h-5 opacity-60 hover:opacity-100 transition-opacity cursor-default"
          />
          <img
            src="https://cdn.activepieces.com/pieces/openai.svg"
            alt="OpenAI"
            className="w-5 h-5 opacity-60 hover:opacity-100 transition-opacity cursor-default"
          />
          <img
            src="https://cdn.activepieces.com/pieces/anthropic.svg"
            alt="Anthropic"
            className="w-5 h-5 opacity-60 hover:opacity-100 transition-opacity cursor-default"
          />
          <span className="text-[13px] text-zinc-400 dark:text-zinc-500 ml-0.5">
            + more
          </span>
        </div>
      </div>
    </div>
  );
};
