import { t } from 'i18next';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useTelemetry } from '@/components/telemetry-provider';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  run_agent: 'https://cdn.activepieces.com/pieces/agent.png',
  generateImage: 'https://cdn.activepieces.com/pieces/image-ai.svg',
  askAi: 'https://cdn.activepieces.com/pieces/text-ai.svg',
  summarizeText: 'https://cdn.activepieces.com/pieces/text-ai.svg',
  classifyText: 'https://cdn.activepieces.com/pieces/text-ai.svg',
  extractStructuredData: 'https://cdn.activepieces.com/pieces/ai-utility.svg',
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

  return (
    <ScrollArea className="h-full" viewPortClassName="h-full">
      <div className="grid grid-cols-3 p-2 gap-3 min-w-[350px]">
        {aiActions.map((item, index) => {
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
              onClick={() => {
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
              }}
            />
          );
        })}
      </div>
    </ScrollArea>
  );
};
