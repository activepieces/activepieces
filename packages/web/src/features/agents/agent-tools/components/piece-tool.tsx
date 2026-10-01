import { isNil } from '@activepieces/core-utils';
import { AgentPieceTool, mcpToolNameUtils } from '@activepieces/shared';
import { t } from 'i18next';
import { Plus, Puzzle, X } from 'lucide-react';
import { useMemo } from 'react';

import { LogoPlate } from '@/components/custom/logo-plate';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { appConnectionsQueries } from '@/features/connections/hooks/app-connections-hooks';
import { stepsHooks } from '@/features/pieces/hooks/steps-hooks';
import { PieceStepMetadataWithSuggestions } from '@/features/pieces/types';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { agentToolAccount } from '../lib/agent-tool-account';
import { usePieceToolsDialogStore } from '../stores/pieces-tools';

const CONNECTION_PAGE_SIZE = 1000;

type AgentPieceToolProps = {
  disabled?: boolean;
  tools: AgentPieceTool[];
  removeTool: (toolName: string) => void;
};

export const AgentPieceToolComponent = ({
  disabled,
  tools,
  removeTool,
}: AgentPieceToolProps) => {
  const { openAddPieceToolDialog } = usePieceToolsDialogStore();

  const { metadata } = stepsHooks.useAllStepsMetadata({
    searchQuery: '',
    type: 'action',
  });

  const piecesMetadata = useMemo(() => {
    return metadata?.filter(
      (m): m is PieceStepMetadataWithSuggestions =>
        'suggestedActions' in m && 'suggestedTriggers' in m,
    );
  }, [metadata]);

  const pieceMetadata = piecesMetadata?.find(
    (p) => p.pieceName === tools[0].pieceMetadata.pieceName,
  );

  // One project-wide query keyed only on the project, so every tool row on the screen shares a
  // single cache entry with the rest of the app instead of each fetching the same list again.
  const projectId = authenticationSession.getProjectId()!;
  const {
    data: connections,
    isSuccess,
    isFetching,
  } = appConnectionsQueries.useAppConnections({
    request: { projectId, limit: CONNECTION_PAGE_SIZE },
    extraKeys: [projectId],
    enabled: !isNil(pieceMetadata?.auth),
  });
  const connectionsComplete = agentToolAccount.listIsComplete({
    isSuccess,
    isFetching,
    count: connections?.data.length ?? 0,
    pageSize: CONNECTION_PAGE_SIZE,
  });

  if (!pieceMetadata) {
    return (
      <div className="flex  w-full items-center justify-between px-3 h-12  border-b last:border-0 py-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded-md" />
          <Skeleton className="h-4 w-32" />
        </div>

        <Skeleton className="h-4 w-4 rounded-md" />
      </div>
    );
  }

  const toolsNeedingAccount = tools.filter((tool) =>
    agentToolAccount.requiresAccount({
      pieceHasAuth: !isNil(pieceMetadata.auth),
      actionRequireAuth: pieceMetadata.suggestedActions?.find(
        (action) => action.name === tool.pieceMetadata.actionName,
      )?.requireAuth,
    }),
  );
  const account = agentToolAccount.resolve({
    tools: toolsNeedingAccount,
    connections: connections?.data ?? [],
    connectionsComplete,
  });
  const accountText =
    account?.state === 'connected' && account.text === pieceMetadata.displayName
      ? t('Connected')
      : account?.text;

  const handleEditTool = (tool: AgentPieceTool) => {
    openAddPieceToolDialog({ page: 'action-inputs', tool });
  };

  return (
    <AccordionItem
      value={pieceMetadata.pieceName}
      className="border-b last:border-0"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-4 transition-all">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoPlate
              src={pieceMetadata.logoUrl}
              alt={pieceMetadata.displayName}
              className="size-8 p-1.5"
              fallback={<Puzzle className="h-5 w-5" />}
            />

            <span className="text-sm font-medium">
              {pieceMetadata.displayName}
            </span>
          </div>
          {!isNil(account) && (
            <span className="ms-3 flex min-w-0 shrink items-center gap-1.5 text-sm text-gray-11">
              <span
                className={cn(
                  'size-[6px] shrink-0 rounded-full',
                  account.state === 'connected' && 'bg-success-11',
                  account.state === 'deleted' && 'bg-danger-11',
                  account.state === 'missing' && 'bg-warning-11',
                  account.state === 'mixed' && 'bg-gray-11',
                )}
              />
              <span className="truncate">{accountText}</span>
            </span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 py-2">
        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => {
            const toolName = pieceMetadata.suggestedActions?.find(
              (action) =>
                mcpToolNameUtils.createPieceToolName(
                  pieceMetadata.pieceName,
                  action.name,
                ) === tool.toolName,
            )?.displayName;
            return (
              <div
                key={tool.toolName}
                onClick={() => handleEditTool(tool)}
                className={`
                  group flex items-center gap-2 px-3 py-1 cursor-pointer
                  rounded-full border bg-gray-3/50
                  ${disabled ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                <span className="text-sm font-medium">
                  {toolName || tool.toolName}
                </span>

                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        disabled={disabled}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTool(tool.toolName);
                        }}
                        variant="ghost"
                        size="icon"
                        className="
                          size-5 p-0.5
                          text-gray-11
                          hover:text-danger-11
                          hover:bg-danger-3
                          transition
                        "
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('Remove tool')}</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
        <Button
          variant="link"
          className="mt-4"
          size="xs"
          onClick={() =>
            openAddPieceToolDialog({
              page: 'actions-list',
              piece: pieceMetadata,
            })
          }
        >
          <Plus className="size-3 mr-1" />
          {t('Add action')}
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
};
