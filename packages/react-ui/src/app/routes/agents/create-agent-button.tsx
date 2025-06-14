import { PopoverTrigger } from '@radix-ui/react-popover';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { Agent } from '@activepieces/shared';

import { agentsApi } from './agents-api';

interface CreateAgentButtonProps {
  onAgentCreated: (agent: Agent) => void;
  isAgentsEnabled: boolean;
}

export const CreateAgentButton = ({
  onAgentCreated,
  isAgentsEnabled,
}: CreateAgentButtonProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const createAgentMutation = useMutation({
    mutationFn: () =>
      agentsApi.create({
        displayName: 'Fresh Agent',
        description:
          'I am a fresh agent, Jack of all trades, master of none (yet)',
      }),
    onSuccess: (newAgent) => {
      onAgentCreated(newAgent);
      setOpen(false);
    },
  });

  const handleButtonClick = () => {
    createAgentMutation.mutate();
  };

  const handleConfigureClick = () => {
    setOpen(false);
    navigate('/platform/setup/ai');
  };

  if (isAgentsEnabled) {
    return (
      <Button
        onClick={handleButtonClick}
        size={'sm'}
        disabled={createAgentMutation.isPending}
      >
        <Plus className="h-4 w-4 mr-2" />
        {createAgentMutation.isPending ? t('Creating...') : t('Create Agent')}
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button onClick={() => setOpen(true)} size={'sm'}>
          <Plus className="h-4 w-4 mr-2" />
          {t('Create Agent')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 mr-4">
        <div className="space-y-4">
          <h4 className="font-medium leading-none">
            {t('Connect an OpenAI Provider')}
          </h4>
          <p className="text-sm text-muted-foreground">
            {t(
              "To create an agent, you'll first need to connect an OpenAI in platform settings.",
            )}
          </p>
          <Button
            variant="secondary"
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
