import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Wand, Info } from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { McpToolsSection } from '@/app/routes/mcp-servers/id/mcp-config/mcp-tools-section';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
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

import { agentsApi } from '../agents-api';

import { ChangeSaveBar } from './change-save-bar';
import { TestAgent } from './test-agent';

interface AgentBuilderProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  agent?: Agent;
  refetch: () => void;
}

interface AgentFormValues {
  systemPrompt: string;
}

export const AgentBuilder = ({
  isOpen,
  onOpenChange,
  refetch,
  trigger,
  agent,
}: AgentBuilderProps) => {
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
    <Drawer
      open={isOpen}
      onOpenChange={onOpenChange}
      className="w-full"
      dismissible={false}
    >
      {trigger}
      <DrawerContent>
        <DrawerHeader>
          <div className="p-4">
            <div className="flex items-center gap-1">
              <Button
                variant="basic"
                size={'icon'}
                className="text-foreground"
                onClick={() => onOpenChange(false)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <DrawerTitle>
                {agent ? 'Edit Agent' : 'Agent Builder'}
              </DrawerTitle>
            </div>
          </div>
        </DrawerHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 h-full justify-center"
        >
          <div className="w-[800px] overflow-y-auto px-6 pb-6 space-y-6">
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
                  {agent && (
                    <TestAgent
                      agentId={agent.id}
                      onSuccess={refetch}
                      disabled={isDirty}
                    />
                  )}
                </div>
                <EditableTextWithPen
                  value={description}
                  className="text-sm text-muted-foreground mt-1"
                  readonly={false}
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

            <div className="flex items-center gap-2"></div>
          </div>

          {showSaveBar && (
            <ChangeSaveBar
              isDirty={isDirty}
              isPending={updatePromptMutation.isPending}
              onReset={handleReset}
              onSubmit={handleSubmit(onSubmit)}
            />
          )}
        </form>
      </DrawerContent>
    </Drawer>
  );
};
