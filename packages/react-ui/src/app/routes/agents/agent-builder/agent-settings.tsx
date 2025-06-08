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
import { Agent } from '@activepieces/shared';

import { McpToolsSection } from '../../mcp-servers/id/mcp-config/mcp-tools-section';
import { agentsApi } from '../agents-api';

import { ChangeSaveBar } from './change-save-bar';

interface AgentSettingsProps {
  agent?: Agent;
  refetch: () => void;
}

interface AgentFormValues {
  systemPrompt: string;
}

export const AgentSettings = ({ agent, refetch }: AgentSettingsProps) => {
  const [displayName, setDisplayName] = useState(agent?.displayName || '');
  const [description, setDescription] = useState(agent?.description || '');
  const { register, handleSubmit, reset, setValue, formState } =
    useForm<AgentFormValues>({
      defaultValues: {
        systemPrompt: '',
      },
    });

  const isDirty = formState.isDirty;
  const hasUnsavedChanges = useRef(false);
  const [showSaveBar, setShowSaveBar] = useState(false);

  useEffect(() => {
    if (agent) {
      setValue('systemPrompt', agent.systemPrompt || '');
      setDisplayName(agent.displayName || '');
      setDescription(agent.description || '');
    } else {
      reset();
      setDisplayName('');
      setDescription('');
    }
    hasUnsavedChanges.current = false;
    setShowSaveBar(false);
  }, [agent, setValue, reset]);

  useEffect(() => {
    hasUnsavedChanges.current = isDirty;
    setShowSaveBar(isDirty);
  }, [isDirty]);

  const updateNameMutation = useMutation({
    mutationFn: (displayName: string) => {
      if (!agent?.id) return Promise.reject('No agent ID');
      return agentsApi.update(agent.id, { displayName });
    },
    onSuccess: () => {
      refetch();
    },
  });

  const updateDescriptionMutation = useMutation({
    mutationFn: (description: string) => {
      if (!agent?.id) return Promise.reject('No agent ID');
      return agentsApi.update(agent.id, { description });
    },
    onSuccess: () => {
      refetch();
    },
  });

  const updatePromptMutation = useMutation({
    mutationFn: (values: AgentFormValues) => {
      if (!agent?.id) return Promise.reject('No agent ID');
      return agentsApi.update(agent.id, {
        systemPrompt: values.systemPrompt,
      });
    },
    onSuccess: (values) => {
      hasUnsavedChanges.current = false;
      setShowSaveBar(false);
      reset(
        {
          systemPrompt: values.systemPrompt,
        },
        { keepDirty: false },
      );
      refetch();
    },
  });

  const onSubmit = async (values: AgentFormValues) => {
    await updatePromptMutation.mutateAsync(values);
  };

  const handleReset = () => {
    if (agent) {
      setValue('systemPrompt', agent.systemPrompt || '');
      setDisplayName(agent.displayName || '');
      setDescription(agent.description || '');
    } else {
      reset();
      setDisplayName('');
      setDescription('');
    }
    hasUnsavedChanges.current = false;
    setShowSaveBar(false);
  };

  const handleNameChange = async (value: string) => {
    setDisplayName(value);
    await updateNameMutation.mutateAsync(value);
  };

  const handleDescriptionChange = async (value: string) => {
    setDescription(value);
    await updateDescriptionMutation.mutateAsync(value);
  };

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 h-full">
      <div className="w-full overflow-y-auto px-6 pb-6 space-y-6">
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
          </div>
        )}
        {showSaveBar && (
          <ChangeSaveBar
            isDirty={isDirty}
            isPending={updatePromptMutation.isPending}
            onReset={handleReset}
            onSubmit={handleSubmit(onSubmit)}
          />
        )}
      </div>
    </form>
  );
};
