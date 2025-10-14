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
import { isNil } from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

type EditAgentInFlowBuilderButtonProps = {
  externalAgentId: string;
};

const EditAgentInFlowBuilderButton = ({
  externalAgentId,
}: EditAgentInFlowBuilderButtonProps) => {
  const [isAgentBuilderOpen, setIsAgentBuilderOpen] = useState(false);
  const { data: agent } = agentHooks.useGetByExternalId(externalAgentId);
  const [setLastRerenderPieceSettingsTimeStamp] = useBuilderStateContext(
    (state) => [state.setLastRerenderPieceSettingsTimeStamp],
  );

  if (isNil(agent)) {
    return null;
  }

  return (
    <AgentBuilder
      isOpen={isAgentBuilderOpen}
      showUseInFlow={false}
      onOpenChange={(open) => {
        setIsAgentBuilderOpen(open);
        if (!open) {
          setLastRerenderPieceSettingsTimeStamp(Date.now());
        }
      }}
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
