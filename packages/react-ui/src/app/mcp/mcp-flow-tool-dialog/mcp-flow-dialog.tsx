import { DialogTrigger } from '@radix-ui/react-dialog';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Search } from 'lucide-react';
import React, { useState } from 'react';
import { useDebounce } from 'use-debounce';

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
import { useToast } from '@/components/ui/use-toast';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { mcpApi } from '@/features/mcp/lib/mcp-api';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { McpToolType, TriggerType } from '@activepieces/shared';
import type { PopulatedFlow } from '@activepieces/shared';

import { McpFlowsContent } from './mcp-flows-content';

type McpFlowDialogProps = {
  children: React.ReactNode;
  mcpId: string;
  selectedFlows: string[];
  mode: 'add' | 'edit';
  open: boolean;
  onSuccess: () => void;
  onClose: () => void;
};

export default function McpFlowDialog({
  mcpId,
  mode,
  open,
  selectedFlows: initialSelectedFlows,
  onSuccess,
  children,
  onClose,
}: McpFlowDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const projectId = authenticationSession.getProjectId();
  const { toast } = useToast();
  const [selectedFlows, setSelectedFlows] =
    useState<string[]>(initialSelectedFlows);

  const { data: flows, isLoading: isFlowsLoading } = useQuery({
    queryKey: ['flows', projectId, mcpId],
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
              flow.version.trigger.type === TriggerType.PIECE &&
              flow.version.trigger.settings.pieceName ===
                '@activepieces/piece-mcp',
          );
        });
      return flows;
    },
  });

  const { isPending, mutate: saveTool } = useMutation({
    mutationFn: async () => {
      if (!mcpId) return;

      const currentTools =
        mcp?.tools?.map((tool) => ({
          type: tool.type,
          mcpId: tool.mcpId,
          pieceMetadata: tool.pieceMetadata,
          flowId: tool.flowId,
        })) || [];

      if (selectedFlows.length === 0) return;

      const newTools = selectedFlows.map((flowId) => ({
        type: McpToolType.FLOW,
        mcpId: mcpId,
        pieceMetadata: undefined,
        flowId: flowId,
      }));

      const nonFlowTools = currentTools.filter(
        (tool) => tool.type !== McpToolType.FLOW,
      );
      const updatedTools = [...nonFlowTools, ...newTools];

      return await mcpApi.update(mcpId, { tools: updatedTools });
    },
    onSuccess: () => {
      toast({
        description:
          mode === 'edit'
            ? t('Flow tools updated successfully')
            : t('Flow tools added successfully'),
        duration: 3000,
      });
      onSuccess?.();
      handleClose();
    },
    onError: (error) => {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('Error'),
        description:
          mode === 'edit'
            ? t('Failed to update flow tools')
            : t('Failed to add flow tools'),
        duration: 5000,
      });
    },
  });

  const { data: mcp } = mcpHooks.useMcp(mcpId);

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
      <DialogContent className="min-w-[700px] max-w-[700px] h-[800px] max-h-[800px] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {mode === 'edit' ? t('Edit Flow Tools') : t('Add Flow Tools')}
          </DialogTitle>
          <DialogDescription>
            {t('Select flows to add as MCP tools')}
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

        <ScrollArea className="flex-grow overflow-y-auto px-1 pt-4">
          <McpFlowsContent
            flows={flows || []}
            searchQuery={debouncedQuery}
            selectedFlows={selectedFlows}
            setSelectedFlows={setSelectedFlows}
            isFlowsLoading={isFlowsLoading}
          />
        </ScrollArea>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              {t('Close')}
            </Button>
          </DialogClose>
          <Button
            loading={isPending}
            type="button"
            onClick={() => saveTool()}
            disabled={selectedFlows.length === 0}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
