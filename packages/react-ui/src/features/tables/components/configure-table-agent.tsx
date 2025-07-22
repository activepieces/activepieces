import {
  McpToolRequest,
  TableAutomationStatus,
  TableAutomationTrigger,
} from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { Bot, BotOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { tablesApi } from '../lib/tables-api';

import { AgentProfile } from './agent-profile';
import { useTableState } from './ap-table-state-provider';

import { McpToolsSection } from '@/app/routes/mcp-servers/id/mcp-config/mcp-tools-section';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { agentsApi } from '@/features/agents/lib/agents-api';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';

interface ConfigureTableAgentFormValues {
  trigger: TableAutomationTrigger;
  systemPrompt: string;
  tools: McpToolRequest[];
}

const ConfigureTableAgent = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const [table, toggleStatus] = useTableState((state) => [
    state.table,
    state.toggleStatus,
  ]);

  const {
    data: mcp,
    isLoading,
    refetch: refetchMcp,
  } = mcpHooks.useMcp(table?.agent?.mcpId);
  const { mutate: updateTools } = mcpHooks.updateTools(
    table?.agent?.mcpId!,
    refetchMcp,
  );

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<ConfigureTableAgentFormValues>({
    defaultValues: {
      trigger: TableAutomationTrigger.ON_DEMAND,
      systemPrompt: '',
      tools: [],
    },
  });

  useEffect(() => {
    reset({
      trigger: table?.trigger,
      systemPrompt: table?.agent?.systemPrompt,
      tools: [],
    });
  }, [reset]);

  const mutation = useMutation({
    mutationFn: async (values: ConfigureTableAgentFormValues) => {
      await tablesApi.update(table.id, {
        trigger: values.trigger,
      });
      const agent = table.agent!;
      await agentsApi.update(agent.id, {
        systemPrompt: values.systemPrompt,
      });
    },
    onSuccess: () => {
      setDialogOpen(false);
    },
  });

  const onToolsUpdate = (updatedTools: McpToolRequest[]) => {
    setValue('tools', updatedTools);
    updateTools(updatedTools);
  };

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values);
  });

  const isAgentEnabled = table?.status === TableAutomationStatus.ENABLED;

  const handleAgentStatusChange = (checked: boolean) => {
    toggleStatus();
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {isAgentEnabled && (
          <AgentProfile
            isEnabled={isAgentEnabled}
            onClick={() => setDialogOpen(true)}
          />
        )}
        <Switch
          checkedIcon={<Bot className="h-4 w-4 " />}
          uncheckedIcon={<BotOff className="h-4 w-4 " />}
          checked={isAgentEnabled}
          onCheckedChange={handleAgentStatusChange}
          size="lg"
          color="secondary"
          aria-label="Enable Data Agent"
        />
      </div>
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Data Agent</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4" />
                <span className="font-medium">Agent Behavior</span>
              </div>
              <Textarea
                {...register('systemPrompt')}
                placeholder="When there is new row, do the following then once you are done, update the row with the result"
                minRows={4}
              />
            </div>
            <McpToolsSection
              mcp={mcp}
              isLoading={isLoading}
              onToolsUpdate={onToolsUpdate}
              showEmptyState={true}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setDialogOpen(false);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button variant="default" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { ConfigureTableAgent };
