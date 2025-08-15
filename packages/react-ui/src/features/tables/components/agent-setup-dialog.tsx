import { Sparkle, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { agentHooks } from '@/features/agents/lib/agent-hooks';
import { PopulatedAgent } from '@activepieces/shared';

type AgentSetupDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  agent: PopulatedAgent | undefined;
  updateAgent: (agent: PopulatedAgent) => void;
  setAgentConfigureOpen: (open: boolean) => void;
  trigger?: React.ReactNode;
  setAiAgentMode: (mode: boolean) => void;
};

export const AgentSetupDialog = ({
  open,
  setOpen,
  agent,
  trigger,
  updateAgent,
  setAgentConfigureOpen,
  setAiAgentMode,
}: AgentSetupDialogProps) => {
  const [prompt, setPrompt] = useState('');
  const [allowAgentCreateColumns, setAllowAgentCreateColumns] = useState(true);

  if (!agent?.id) {
    return null;
  }

  const { mutate: updateAgentSettings } = agentHooks.useUpdate(
    agent.id,
    updateAgent,
  );

  return (
    <Popover
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        setAiAgentMode(false);
      }}
    >
      <PopoverTrigger asChild>
        <div onClick={(e) => e.preventDefault()}>{trigger}</div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-0 z-[9999]"
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <div className="relative p-6">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex flex-col gap-4">
            <div className="text-center flex flex-col">
              <span className="text-lg font-semibold text-foreground">
                What do you want the AI
              </span>
              <span className="text-lg font-semibold text-foreground">
                agent to do in this table?
              </span>
            </div>

            <div className="space-y-6">
              <Textarea
                placeholder="Enter prompt i.e, create engaging tweets for social media"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] resize-none"
              />

              <Button
                variant="outline"
                className="w-full h-7 text-sm rounded-sm"
              >
                Generate prompts from table
                <Sparkle className="w-4 h-4 ml-2" />
              </Button>

              <div className="flex items-center gap-2">
                <Switch
                  checked={allowAgentCreateColumns}
                  onCheckedChange={setAllowAgentCreateColumns}
                />
                <span className="text-sm text-foreground">
                  Allow agent to create new columns if needed
                </span>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  updateAgentSettings({
                    ...agent,
                    systemPrompt: prompt,
                    settings: {
                      ...agent.settings,
                      allowAgentCreateColumns,
                      aiMode: true,
                    },
                  });
                  setAiAgentMode(true);
                  setOpen(false);
                  setAgentConfigureOpen(true);
                }}
              >
                Configure agent
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
