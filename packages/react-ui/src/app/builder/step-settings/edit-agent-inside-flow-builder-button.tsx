import { t } from 'i18next';
import { Settings2 } from 'lucide-react';
import { useState } from 'react';

import { AgentBuilder } from '@/app/routes/agents/builder';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { agentHooks } from '@/features/agents/lib/agent-hooks';

import { useBuilderStateContext } from '../builder-hooks';

const EditAgentInFlowBuilderButton = ({ agentId }: { agentId: string }) => {
  const [isAgentBuilderOpen, setIsAgentBuilderOpen] = useState(false);
  const { data: agent } = agentHooks.useGet(agentId);
  const { refetch } = agentHooks.useList();
  const [setLastRerenderPieceSettingsTimeStamp] = useBuilderStateContext(
    (state) => [state.setLastRerenderPieceSettingsTimeStamp],
  );
  return (
    <AgentBuilder
      refetch={refetch}
      isOpen={isAgentBuilderOpen}
      onOpenChange={(open) => {
        setIsAgentBuilderOpen(open);
        if (!open) {
          setLastRerenderPieceSettingsTimeStamp(Date.now());
        }
      }}
      hideUseAgentButton={true}
      agent={agent}
      trigger={
        <Tooltip>
          <TooltipTrigger>
            <Button
              className="text-foreground"
              variant="ghost"
              size="icon"
              onClick={() => setIsAgentBuilderOpen(true)}
            >
              <Settings2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('Agent Settings')}</TooltipContent>
        </Tooltip>
      }
    ></AgentBuilder>
  );
};

EditAgentInFlowBuilderButton.displayName = 'EditAgentInFlowBuilderButton';

export { EditAgentInFlowBuilderButton };
