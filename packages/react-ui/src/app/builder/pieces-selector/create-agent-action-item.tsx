import { t } from 'i18next';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AgentBuilder } from '@/app/routes/agents/builder';
import { ToastAction } from '@/components/ui/toast';
import { toast } from '@/components/ui/use-toast';
import { agentHooks } from '@/features/agents/lib/agent-hooks';
import { UpgradeHookDialog } from '@/features/billing/components/upgrade-hook';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';
import { PieceSelectorOperation, PieceSelectorPieceItem } from '@/lib/types';
import { Agent, ApFlagId, ErrorCode } from '@activepieces/shared';

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
  const { data: isAgentsEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.AGENTS_CONFIGURED,
  );
  const [isAgentBuilderOpen, setIsAgentBuilderOpen] = useState(false);
  const [agent, setAgent] = useState<Agent | undefined>(undefined);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { refetch } = agentHooks.useList();
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
    <>
      <AgentBuilder
        isOpen={isAgentBuilderOpen}
        refetch={refetch}
        onChange={(agent) => {
          setAgent(agent);
        }}
        hideUseAgentButton={true}
        onOpenChange={(open) => {
          setIsAgentBuilderOpen(open);
          if (!open) {
            if (agent) {
              handleAddingOrUpdatingCustomAgentPieceSelectorItem(
                pieceSelectorItem,
                agent,
                operation,
                handleAddingOrUpdatingStep,
              );
            }
            setAgent(undefined);
          }
        }}
        agent={agent}
        trigger={
          <GenericActionOrTriggerItem
            item={createAgentPieceSelectorItem}
            hidePieceIconAndDescription={hidePieceIconAndDescription}
            stepMetadataWithSuggestions={
              createAgentPieceSelectorItem.pieceMetadata
            }
            onClick={() => {
              if (!isAgentsEnabled) {
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
                },
                {
                  onSuccess: (agent) => {
                    setAgent(agent);
                    setIsAgentBuilderOpen(true);
                  },
                  onError: (err: Error) => {
                    if (api.isApError(err, ErrorCode.QUOTA_EXCEEDED)) {
                      setShowUpgradeDialog(true);
                    } else {
                      toast({
                        title: t('Error'),
                        description: t(
                          'Failed to create agent. Please try again.',
                        ),
                      });
                    }
                  },
                },
              );
            }}
          />
        }
      />
      <UpgradeHookDialog
        metric="agents"
        open={showUpgradeDialog}
        setOpen={setShowUpgradeDialog}
      />
    </>
  );
};

export default CreateAgentActionItem;
