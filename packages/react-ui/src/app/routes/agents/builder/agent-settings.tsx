import { t } from 'i18next';
import { Wand, Info } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import EditableTextWithPen from '@/components/ui/editable-text-with-pen';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Agent,
  AgentOutputField,
  AgentOutputType,
  isNil,
} from '@activepieces/shared';

import { agentHooks } from '../../../../features/agents/lib/agent-hooks';
import { UseAgentButton } from '../../../../features/agents/use-agent-button';
import { McpToolsSection } from '../../mcp-servers/id/mcp-config/mcp-tools-section';

import { AgentSettingsOutput } from './agent-settings-output';

interface AgentSettingsProps {
  agent?: Agent;
  refetch: () => void;
  onChange?: (agent: Agent) => void;
  hideUseAgentButton?: boolean;
}

interface AgentFormValues {
  systemPrompt: string;
}

export const AgentSettings = ({
  agent,
  refetch,
  onChange,
  hideUseAgentButton,
}: AgentSettingsProps) => {
  const [displayName, setDisplayName] = useState(agent?.displayName || '');
  const [description, setDescription] = useState(agent?.description || '');
  const { register, watch, setValue } = useForm<AgentFormValues>({
    defaultValues: {
      systemPrompt: '',
    },
  });

  const systemPrompt = watch('systemPrompt');
  const debounceTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (agent) {
      setValue('systemPrompt', agent.systemPrompt || '');
      setDisplayName(agent.displayName || '');
      setDescription(agent.description || '');
    } else {
      setValue('systemPrompt', '');
      setDisplayName('');
      setDescription('');
    }
  }, [agent, setValue]);

  const updateAgentMutation = agentHooks.useUpdate();

  useEffect(() => {
    if (!agent?.id) return;

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      if (systemPrompt !== agent.systemPrompt) {
        updateAgentMutation.mutate(
          { id: agent.id, request: { systemPrompt } },
          { onSuccess: () => refetch() },
        );
      }
    }, 1000);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [systemPrompt, agent?.id, agent?.systemPrompt]);

  const handleNameChange = async (value: string) => {
    setDisplayName(value);
    if (agent) {
      onChange?.({ ...agent, displayName: value });
    }
    await updateAgentMutation.mutateAsync(
      { id: agent!.id, request: { displayName: value } },
      { onSuccess: () => refetch() },
    );
  };

  const handleDescriptionChange = async (value: string) => {
    setDescription(value);
    if (agent) {
      onChange?.({ ...agent, description: value });
    }
    await updateAgentMutation.mutateAsync(
      { id: agent!.id, request: { description: value } },
      { onSuccess: () => refetch() },
    );
  };

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const handleOutputChange = (
    outputType: AgentOutputType,
    outputFields: AgentOutputField[],
  ) => {
    if (!agent?.id) return;
    updateAgentMutation.mutate(
      { id: agent.id, request: { outputType, outputFields } },
      { onSuccess: () => refetch() },
    );
  };

  return (
    <div className="flex flex-1 h-full">
      <div className="w-full px-6 pb-6 space-y-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex-shrink-0">
            <ImageWithFallback
              src={agent?.profilePictureUrl}
              alt="Agent avatar"
              className="w-20 h-20 rounded-xl object-cover"
            />
          </div>
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2 justify-between">
              <EditableTextWithPen
                value={displayName}
                className="text-2xl font-semibold"
                readonly={isNil(agent)}
                onValueChange={handleNameChange}
                isEditing={isEditingName}
                setIsEditing={setIsEditingName}
              />
              {!isNil(agent) && !hideUseAgentButton && (
                <UseAgentButton agentId={agent.id} />
              )}
            </div>
            <EditableTextWithPen
              value={description}
              className="text-sm text-muted-foreground mt-1 max-w-[400px]"
              readonly={isNil(agent)}
              onValueChange={handleDescriptionChange}
              isEditing={isEditingDescription}
              setIsEditing={setIsEditingDescription}
            />
          </div>
        </div>

        <div className="space-y-6">
          <Separator className="my-2" />
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-lg">
                <Wand className="w-4 h-4" />
                <span>{t('Instructions')}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {t(
                        'Define how your agent should behave and respond to tasks.',
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
          <Textarea
            id="system-prompt"
            {...register('systemPrompt')}
            placeholder="You are a helpful assistant that specializes in scheduling meetings."
            className="min-h-[100px] resize-none w-full"
            disabled={isNil(agent)}
          />
        </div>

        {!isNil(agent) && !isNil(agent.mcpId) && (
          <div className="space-y-6">
            <McpToolsSection mcpId={agent.mcpId} />
            <AgentSettingsOutput onChange={handleOutputChange} agent={agent} />
          </div>
        )}
      </div>
    </div>
  );
};
