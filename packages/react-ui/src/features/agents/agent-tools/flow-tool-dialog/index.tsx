import { DialogTrigger } from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Search } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  PopulatedFlow,
  AgentTool,
  FlowTriggerType,
  AgentToolType,
} from '@activepieces/shared';

import { FlowDialogContent } from './flow-dialog-content';

type AgentFlowToolDialogProps = {
  children: React.ReactNode;
  selectedFlows: string[];
  open: boolean;
  onToolsUpdate: (tools: AgentTool[]) => void;
  onClose: () => void;
  tools: AgentTool[];
};

export function AgentFlowToolDialog({
  open,
  selectedFlows: initialSelectedFlows,
  onToolsUpdate,
  children,
  onClose,
  tools,
}: AgentFlowToolDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFlows, setSelectedFlows] =
    useState<string[]>(initialSelectedFlows);

  const projectId = authenticationSession.getProjectId();

  const { data: flows } = useQuery({
    queryKey: ['flows', projectId],
    queryFn: async () => {
      const flows = await flowsApi
        .list({
          cursor: undefined,
          limit: 1000,
          projectId: projectId!,
        })
        .then((response) => {
          return response.data.filter(
            (flow: PopulatedFlow) =>
              flow.version.trigger.type === FlowTriggerType.PIECE &&
              flow.version.trigger.settings.pieceName ===
                '@activepieces/piece-mcp',
          );
        });
      return flows;
    },
  });

  const handleSave = () => {
    const newTools = selectedFlows.map((flowId) => ({
      type: AgentToolType.FLOW,
      flowId: flowId,
      toolName: flowId,
    })) as AgentTool[];

    const nonFlowTools: AgentTool[] = tools.filter(
      (tool) => tool.type !== AgentToolType.FLOW,
    );

    const updatedTools = [...nonFlowTools, ...newTools];
    onToolsUpdate(updatedTools);
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[90vw] max-w-[750px] h-[80vh] max-h-[800px] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('Add Flow Tools')}</DialogTitle>
          <DialogDescription>
            {t('Select flows to add as agent tools')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-1">
          <div className="relative mt-1">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('Search flows')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <ScrollArea className="grow overflow-y-auto px-1 pt-4">
          <FlowDialogContent
            flows={flows || []}
            searchQuery={searchQuery}
            selectedFlows={selectedFlows}
            setSelectedFlows={setSelectedFlows}
          />
        </ScrollArea>

        <DialogFooter>
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
