import { useMutation } from '@tanstack/react-query';
import { Wand, Info, Activity } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import EditableTextWithPen from '@/components/ui/editable-text-with-pen';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Agent, AgentOutputField, AgentOutputType } from '@activepieces/shared';

import { McpToolsSection } from '../../mcp-servers/id/mcp-config/mcp-tools-section';
import { agentsApi } from '../agents-api';

import { AgentSettingsOutput } from './agent-settings-output';
import { AgentTestRunButton } from './agent-test-run-button';

interface AgentSettingsProps {
  agent?: Agent;
  refetch: () => void;
}

interface AgentFormValues {
  systemPrompt: string;
}

type AgentUpdateFields = {
  displayName?: string;
  description?: string;
  systemPrompt?: string;
  outputType?: string;
  outputFields?: any[];
};

export const AgentSettings = ({ agent, refetch }: AgentSettingsProps) => {
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

  const updateAgentMutation = useMutation({
    mutationFn: (fields: AgentUpdateFields) => {
      if (!agent?.id) return Promise.reject('No agent ID');
      return agentsApi.update(agent.id, fields);
    },
    onSuccess: () => {
      refetch();
    },
  });

  // Auto-save system prompt with debounce
  useEffect(() => {
    if (!agent?.id) return;

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      if (systemPrompt !== agent.systemPrompt) {
        updateAgentMutation.mutate({ systemPrompt });
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
    await updateAgentMutation.mutateAsync({ displayName: value });
  };

  const handleDescriptionChange = async (value: string) => {
    setDescription(value);
    await updateAgentMutation.mutateAsync({ description: value });
  };

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const handleOutputChange = (
    outputType: AgentOutputType,
    outputFields: AgentOutputField[],
  ) => {
    if (!agent?.id) return;
    updateAgentMutation.mutate({ outputType, outputFields });
  };

  return (
    <div className="flex flex-1 h-full">
      <div className="w-full px-6 pb-6 space-y-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex-shrink-0">
            <img
              src={
                agent?.profilePictureUrl ||
                'https://cdn.activepieces.com/quicknew/agents/robots/robot_7000.png'
              }
              alt="Agent avatar"
              className="w-20 h-20 rounded-xl object-cover border"
            />
          </div>
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2 justify-between">
              <EditableTextWithPen
                value={displayName}
                className="text-2xl font-semibold"
                readonly={false}
                onValueChange={handleNameChange}
                isEditing={isEditingName}
                setIsEditing={setIsEditingName}
              />
              <div>{agent && <AgentTestRunButton agentId={agent.id} />}</div>
            </div>
            <EditableTextWithPen
              value={description}
              className="text-sm text-muted-foreground mt-1"
              readonly={false}
              onValueChange={handleDescriptionChange}
              isEditing={isEditingDescription}
              setIsEditing={setIsEditingDescription}
            />
            <div className="flex items-center gap-2 mt-2">
              <Activity className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">
                Task Completed: {agent?.taskCompleted}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Separator className="my-2" />
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-lg">
                <Wand className="w-4 h-4" />
                <span>Instructions</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Define how your agent should behave and respond to
                        tasks.
                      </p>
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
          />
        </div>

        {agent?.mcpId && (
          <div className="space-y-6">
            <McpToolsSection mcpId={agent.mcpId} />
            <AgentSettingsOutput onChange={handleOutputChange} agent={agent} />
          </div>
        )}
      </div>
    </div>
  );
};
