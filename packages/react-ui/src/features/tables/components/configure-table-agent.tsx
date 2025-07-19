import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Bot, BotOff, Code, Lightbulb, LightbulbOff } from 'lucide-react';
import { Settings2 } from 'lucide-react'; // gear icon from lucide-dev
import { McpToolsSection } from '@/app/routes/mcp-servers/id/mcp-config/mcp-tools-section';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';
import { useMutation } from '@tanstack/react-query';
import { McpToolRequest, TableAutomationTrigger } from '@activepieces/shared';
import { tablesApi } from '../lib/tables-api';
import { useTableState } from './ap-table-state-provider';
import { agentsApi } from '@/features/agents/lib/agents-api';
import { Switch } from '@/components/ui/switch';

interface ConfigureTableAgentFormValues {
  trigger: TableAutomationTrigger;
  systemPrompt: string;
  tools: McpToolRequest[];
}

const ConfigureTableAgent = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const [table] = useTableState((state) => [state.table]);

  const { data: mcp, isLoading } = mcpHooks.useMcp(table?.agent?.mcpId);

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

  const onToolsUpdate = (updatedTools: any[]) => {
    setValue('tools', updatedTools);
  };

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values);
  });

  const [isAgentEnabled, setIsAgentEnabled] = useState(false);
  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDialogOpen(true)}
          aria-label="Configure Data Agent"
     
        >
          <img
            src="https://cdn.activepieces.com/quicknew/agents/robots/robot_186.png"
            alt="Locked"
            className="w-7 h-7 rounded-full object-cover"
            style={{ display: isAgentEnabled ? 'inline-block' : 'none' }}
          />
        </Button>
        <Switch
          checkedIcon={<Bot className="h-4 w-4 " />}
          uncheckedIcon={<BotOff className="h-4 w-4 " />} 
          checked={isAgentEnabled}
          onCheckedChange={setIsAgentEnabled}
          size="lg"
          color="secondary"
          variant="square"
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
              <Button
                variant="default"
                type="submit"
                disabled={isSubmitting}
              >
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