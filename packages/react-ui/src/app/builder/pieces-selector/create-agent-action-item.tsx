import { t } from 'i18next';
import { useNavigate } from 'react-router-dom';

import { ToastAction } from '@/components/ui/toast';
import { toast } from '@/components/ui/use-toast';
import { agentHooks } from '@/features/agents/lib/agent-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { PieceSelectorOperation, PieceSelectorPieceItem } from '@/lib/types';
import { ApFlagId } from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

import { handleAddingOrUpdatingCustomAgentPieceSelectorItem } from './custom-piece-selector-items-utils';
import GenericActionOrTriggerItem from './generic-piece-selector-item';

type CreateAgentActionItemProps = {
  pieceSelectorItem: PieceSelectorPieceItem;
  operation: PieceSelectorOperation;
  hidePieceIconAndDescription: boolean;
};

const CreateAgentActionItem = ({
  pieceSelectorItem,
  operation,
  hidePieceIconAndDescription,
}: CreateAgentActionItemProps) => {
  const { data: isAgentsConfigured } = flagsHooks.useFlag<boolean>(
    ApFlagId.AGENTS_CONFIGURED,
  );
  const [handleAddingOrUpdatingStep] = useBuilderStateContext((state) => [
    state.handleAddingOrUpdatingStep,
  ]);
  const createAgentPieceSelectorItem: PieceSelectorPieceItem = JSON.parse(
    JSON.stringify(pieceSelectorItem),
  );
  const { mutate: createAgent } = agentHooks.useCreate();
  createAgentPieceSelectorItem.actionOrTrigger.displayName = t('Create Agent');
  createAgentPieceSelectorItem.actionOrTrigger.description = t(
    'Create a new agent to run in your flow',
  );
  const navigate = useNavigate();

  return (
    <GenericActionOrTriggerItem
      item={createAgentPieceSelectorItem}
      hidePieceIconAndDescription={hidePieceIconAndDescription}
      stepMetadataWithSuggestions={createAgentPieceSelectorItem.pieceMetadata}
      onClick={() => {
        if (!isAgentsConfigured) {
          toast({
            title: t('Connect to OpenAI'),
            description: t(
              "To create an agent, you'll first need to connect to OpenAI in platform settings.",
            ),
            action: (
              <ToastAction
                altText="Try again"
                onClick={() => {
                  navigate('/platform/setup/ai');
                }}
              >
                {t('Set Up')}
              </ToastAction>
            ),
          });
          return;
        }
        createAgent(
          {
            displayName: 'Fresh Agent',
            description:
              'I am a fresh agent, Jack of all trades, master of none (yet)',
            systemPrompt: '',
          },
          {
            onSuccess: (agent) => {
              handleAddingOrUpdatingCustomAgentPieceSelectorItem(
                pieceSelectorItem,
                agent,
                operation,
                handleAddingOrUpdatingStep,
              );
            },
            onError: () => {
              toast({
                variant: 'destructive',
                description: 'Error creating agent',
              });
            },
          },
        );
      }}
    />
  );
};

export default CreateAgentActionItem;
