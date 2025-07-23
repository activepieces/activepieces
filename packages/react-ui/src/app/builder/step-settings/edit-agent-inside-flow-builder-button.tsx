import { t } from 'i18next';
import { Settings } from 'lucide-react';
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
              size="icon"
              className="size-8"
              onClick={() => setIsAgentBuilderOpen(true)}
              variant="outline-primary"
            >
              <div className="flex items-center justify-center rounded-sm p-0.5 ">
                <Settings className="size-5" />
              </div>
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
