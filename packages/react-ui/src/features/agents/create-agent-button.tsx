import { PopoverTrigger } from '@radix-ui/react-popover';
import { t } from 'i18next';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { Agent } from '@activepieces/shared';

import { agentHooks } from './lib/agent-hooks';

interface CreateAgentButtonProps {
  onAgentCreated: (agent: Agent) => void;
  isAgentsConfigured: boolean;
}

export const CreateAgentButton = ({
  isAgentsConfigured,
  onAgentCreated,
}: CreateAgentButtonProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const createAgentMutation = agentHooks.useCreate();

  const handleButtonClick = () => {
    createAgentMutation.mutate(
      {
        displayName: 'Fresh Agent',
        description:
          'I am a fresh agent, Jack of all trades, master of none (yet)',
      },
      {
        onSuccess: (newAgent) => {
          onAgentCreated(newAgent);
          setOpen(false);
        },
      },
    );
  };

  const handleConfigureClick = () => {
    setOpen(false);
    navigate('/platform/setup/ai');
  };

  if (isAgentsConfigured) {
    return (
      <Button
        onClick={handleButtonClick}
        disabled={createAgentMutation.isPending}
      >
        <Plus className="h-4 w-4 " />
        {t('New Agent')}
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('New Agent')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 mr-4">
        <div className="space-y-4">
          <h4 className="font-medium leading-none">{t('Connect to OpenAI')}</h4>
          <p className="text-sm text-muted-foreground">
            {t(
              "To create an agent, you'll first need to connect to OpenAI in platform settings.",
            )}
          </p>
          <Button
            variant="accent"
            className="w-full"
            onClick={handleConfigureClick}
          >
            {t('Set Up AI Provider')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
