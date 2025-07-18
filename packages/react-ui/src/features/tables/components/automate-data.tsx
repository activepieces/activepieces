import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Zap } from 'lucide-react';
import { McpToolsSection } from '@/app/routes/mcp-servers/id/mcp-config/mcp-tools-section';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';
import { useMutation } from '@tanstack/react-query';
import { McpToolRequest, TableAutomationTrigger } from '@activepieces/shared';
import { tablesApi } from '../lib/tables-api';
import { useTableState } from './ap-table-state-provider';
import { agentsApi } from '@/features/agents/lib/agents-api';

interface AutomateDataFormValues {
  trigger: TableAutomationTrigger;
  systemPrompt: string;
  tools: McpToolRequest[];
}


const AutomateData = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

const [table] = useTableState((state) => [state.table])

  const { data: mcp, isLoading } = mcpHooks.useMcp(table?.agent?.mcpId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<AutomateDataFormValues>({
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
      tools: []
    });
  }, [reset]);

  const mutation = useMutation({
    mutationFn: async (values: AutomateDataFormValues) => {
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

  return (
    <>
      <Button variant="default" onClick={() => setDialogOpen(true)}>
        Automate Data
      </Button>
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
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4" />
                <span className="font-medium">Agent Run Trigger</span>
              </div>
              <div className="text-muted-foreground text-sm mb-2">
                When do you want the agent to run?
              </div>
              <Select
                value={watch('trigger')}
                onValueChange={(value) => setValue('trigger', value as TableAutomationTrigger)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select run type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TableAutomationTrigger.ON_DEMAND}>On Demand</SelectItem>
                  <SelectItem value={TableAutomationTrigger.ON_NEW_RECORD}>On New Record</SelectItem>
                  <SelectItem value={TableAutomationTrigger.ON_UPDATE_RECORD}>On Record Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border-t border-border my-4" />
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

export { AutomateData };