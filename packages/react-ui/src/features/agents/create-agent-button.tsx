import { PopoverTrigger } from '@radix-ui/react-popover';
import { t } from 'i18next';
import { Plus, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { LoadingSpinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { Agent, CreateAgentRequest } from '@activepieces/shared';

import { AgentImageLoading } from './agent-image-loading';
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const navigate = useNavigate();
  const { mutate: createAgent, isPending } = agentHooks.useCreate();

  const handleCreateAgent = async (createAgentParams: CreateAgentRequest) => {
    return createAgent(
      { ...createAgentParams },
      {
        onSuccess: (newAgent) => {
          onAgentCreated(newAgent);
          setDialogOpen(false);
          setSystemPrompt('');
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4" />
            {t('New Agent')}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg p-4 pt-6">
          <div className="flex flex-col items-center gap-4">
            <AgentImageLoading loading={isPending} />
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">{t('Invent an Agent')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('Describe your agent, and let AI work its magic.')}
              </p>
            </div>

            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder={t(
                'E.g A witty blog writer who specializes in short, engaging posts about tech gadgets and futurism, using a casual and slightly sarcastic tone.',
              )}
              minRows={6}
              maxRows={6}
              className="w-full h-40 px-4 py-3 border border-input rounded-lg resize-none focus-visible:ring-0 outline-none text-sm leading-relaxed"
              disabled={isPending}
            />

            <Button
              className="w-full"
              onClick={() =>
                handleCreateAgent({
                  systemPrompt,
                  displayName: 'Fresh Agent',
                  description:
                    'Fresh agent! jack of all trades, master of none',
                })
              }
              disabled={!systemPrompt.trim() || isPending}
            >
              {isPending ? (
                <>
                  <LoadingSpinner className="size-4" />
                  {t('Preparing Agent...')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {t('Invent')}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
