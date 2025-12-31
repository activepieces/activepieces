import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  AgentTool,
  FlowTriggerType,
  AgentToolType,
  AgentFlowTool,
} from '@activepieces/shared';

import { useAgentToolsStore } from '../store';

import { CreateMcpFlowButton } from './create-mcp-flow-button';
import { FlowDialogContent } from './flow-dialog-content';

type AgentFlowToolDialogProps = {
  onToolsUpdate: (tools: AgentTool[]) => void;
  tools: AgentTool[];
};

export function AgentFlowToolDialog({
  onToolsUpdate,
  tools,
}: AgentFlowToolDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFlows, setSelectedFlows] = useState<AgentFlowTool[]>(
    tools.filter((tools) => tools.type === AgentToolType.FLOW),
  );

  const { showAddFlowDialog, setShowAddFlowDialog } = useAgentToolsStore();

  const projectId = authenticationSession.getProjectId();

  const { data } = useQuery({
    queryKey: ['flows', projectId],
    queryFn: async () => {
      return await flowsApi.list({
        cursor: undefined,
        limit: 1000,
        projectId: projectId!,
      });
    },
  });

  const flows = useMemo(() => {
    return data?.data.filter(
      (flow) =>
        flow.version.trigger.type === FlowTriggerType.PIECE &&
        flow.version.trigger.settings.pieceName === '@activepieces/piece-mcp',
    );
  }, [data]);

  const handleSave = () => {
    const noneFlowTools: AgentTool[] = tools.filter(
      (tool) => tool.type !== AgentToolType.FLOW,
    );

    const updatedTools = [...noneFlowTools, ...selectedFlows];
    setShowAddFlowDialog(false);
    onToolsUpdate(updatedTools);
    toast('Changes to flow tools saved');
  };

  return (
    <Dialog open={showAddFlowDialog} onOpenChange={setShowAddFlowDialog}>
      <DialogContent className="w-[90vw] max-w-[750px] h-[80vh] max-h-[800px] flex flex-col overflow-hidden p-0">
        <DialogHeader className="min-h-16 flex px-4 items-start justify-center mb-0 border-b">
          <DialogTitle>{t('Add Flow Tools')}</DialogTitle>
        </DialogHeader>

        <div className="px-4 py-3 border-b">
          <div className="relative border rounded-sm">
            <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder={t('Search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 shadow-none border-none"
            />
          </div>
        </div>

        <ScrollArea className="grow overflow-y-auto">
          <FlowDialogContent
            flows={flows || []}
            searchQuery={searchQuery}
            selectedFlows={selectedFlows}
            setSelectedFlows={setSelectedFlows}
          />
        </ScrollArea>

        <DialogFooter className="border-t p-4 mt-auto">
          <CreateMcpFlowButton />
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              {t('Close')}
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
