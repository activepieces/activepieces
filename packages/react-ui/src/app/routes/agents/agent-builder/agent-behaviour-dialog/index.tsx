import { Wand } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';

import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Agent, AgentOutputField, AgentOutputType } from '@activepieces/shared';

import { McpToolsSection } from '../../../mcp-servers/id/mcp-config/mcp-tools-section';
import { agentsApi } from '../../agents-api';
import { AgentSettingsOutput } from './agent-settings-output';

interface AgentBehaviourDialogProps {
  agent?: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refetch: () => void;
}

interface AgentFormValues {
  systemPrompt: string;
}

type AgentUpdateFields = {
  systemPrompt?: string;
  outputType?: string;
  outputFields?: any[];
};

export const AgentBehaviourDialog = ({
  agent,
  open,
  onOpenChange,
  refetch,
}: AgentBehaviourDialogProps) => {
  const { register, watch, setValue, getValues } = useForm<AgentFormValues>({
    defaultValues: {
      systemPrompt: '',
    },
  });

  const systemPrompt = watch('systemPrompt');
  const debounceTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (agent) {
      setValue('systemPrompt', agent.systemPrompt || '');
    } else {
      setValue('systemPrompt', '');
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

  const handleOutputChange = (
    outputType: AgentOutputType,
    outputFields: AgentOutputField[],
  ) => {
    if (!agent?.id) return;
    updateAgentMutation.mutate({ outputType, outputFields });
  };

  const handleSave = () => {
    if (!agent?.id) return;
    const values = getValues();
    if (values.systemPrompt !== agent.systemPrompt) {
      updateAgentMutation.mutate({ systemPrompt: values.systemPrompt });
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Agent Behaviour</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-lg">
              <Wand className="w-4 h-4" />
              <span>Instructions</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Define how your agent should behave and respond to tasks.
            </div>
          </div>
          <Textarea
            id="system-prompt"
            {...register('systemPrompt')}
            placeholder="You are a helpful assistant that specializes in scheduling meetings."
            className="min-h-[100px] resize-none w-full"
          />

          {agent?.mcpId && (
            <div className="space-y-6">
              <McpToolsSection mcpId={agent.mcpId} />
              <AgentSettingsOutput onChange={handleOutputChange} agent={agent} />
            </div>
          )}
        </div>
        <Separator className="my-4" />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 