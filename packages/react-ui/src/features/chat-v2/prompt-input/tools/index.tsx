import { t } from 'i18next';
import { Plus, Earth, Code } from 'lucide-react';

import { AgentTools } from '@/app/builder/step-settings/agent-settings/agent-tools';
import { AgentPieceDialog } from '@/app/builder/step-settings/agent-settings/piece-tool-dialog';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePieceToolsDialogStore } from '@/features/agents/agent-tools/stores/pieces-tools';
import { cn } from '@/lib/utils';
import {
  AgentExecuteCodeTool,
  AgentSearchTool,
  AgentTool,
  AgentToolType,
  EXECUTE_TOOL,
  isNil,
  SEARCH_TOOL,
} from '@activepieces/shared';

import { chatHooks } from '../../lib/chat-hooks';
import { useChatSessionStore } from '../../store';

function ToolsButton() {
  const { openAddPieceToolDialog } = usePieceToolsDialogStore();
  const { session, setSession } = useChatSessionStore();
  const { mutate: updateChatSession, isPending: isUpdating } =
    chatHooks.useUpdateChatSession(setSession);

  const tools = !isNil(session) ? session.tools : [];
  const searchEnabled = tools.some(
    (tool) => tool.type === AgentToolType.SEARCH,
  );
  const executeToolEnabled = tools.some(
    (tool) => tool.type === AgentToolType.EXECUTE_CODE,
  );

  const handleToggleTool = ({
    type,
    toolName,
  }: AgentExecuteCodeTool | AgentSearchTool) => {
    const toolExists = tools.some((tool) => tool.type === type);
    const updatedTools = toolExists
      ? tools.filter((tool) => tool.type !== type)
      : [...tools, { type: type, toolName }];

    console.log(updatedTools);

    updateChatSession({
      update: { tools: updatedTools },
      currentSession: session,
    });
  };

  const onToolsUpdate = (updatedTools: AgentTool[]) => {
    if (isNil(session)) return;

    updateChatSession({
      update: { tools: updatedTools },
      currentSession: session,
    });
  };

  const activeToolsCount = tools.length;

  return (
    <>
      <Popover>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'relative',
                    activeToolsCount > 0 && 'text-primary',
                  )}
                >
                  <div className="relative">
                    <Plus className="size-4" />
                  </div>
                  {activeToolsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                      {activeToolsCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {activeToolsCount === 0
                  ? 'Add tools'
                  : `${activeToolsCount} tool${
                      activeToolsCount > 1 ? 's' : ''
                    } enabled`}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <PopoverContent align="start" className="w-80 p-3">
          <div className="space-y-3">
            <div className="px-2">
              <h4 className="text-sm font-semibold">Tools</h4>
              <p className="text-xs text-muted-foreground">
                {t("Enable tools to enhance agent's capabilities")}
              </p>
            </div>

            <div className="space-y-2">
              <label
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-all',
                  'hover:bg-accent/50',
                  searchEnabled && 'border-blue-500/50 bg-blue-500/5',
                  isUpdating && 'opacity-50 cursor-not-allowed',
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md shrink-0',
                    searchEnabled
                      ? 'bg-blue-500/20 text-blue-600'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Earth className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{t('Web Search')}</div>
                </div>
                <Switch
                  checked={searchEnabled}
                  onCheckedChange={() =>
                    handleToggleTool({
                      toolName: SEARCH_TOOL,
                      type: AgentToolType.SEARCH,
                    })
                  }
                  disabled={isUpdating}
                />
              </label>

              <label
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-all',
                  'hover:bg-accent/50',
                  executeToolEnabled && 'border-green-500/50 bg-green-500/5',
                  isUpdating && 'opacity-50 cursor-not-allowed',
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md shrink-0',
                    executeToolEnabled
                      ? 'bg-green-500/20 text-green-600'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Code className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">
                    {t('Code Execution')}
                  </div>
                </div>
                <Switch
                  checked={executeToolEnabled}
                  onCheckedChange={() =>
                    handleToggleTool({
                      toolName: EXECUTE_TOOL,
                      type: AgentToolType.EXECUTE_CODE,
                    })
                  }
                  disabled={isUpdating}
                />
              </label>

              <div className="mt-4 space-y-2">
                <AgentTools
                  emptyStateLabel="Connect custom apps."
                  label="Custom Tools"
                  hideAddButton={true}
                  tools={tools}
                  onToolsUpdate={onToolsUpdate}
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    openAddPieceToolDialog({ page: 'pieces-list' })
                  }
                >
                  <Plus className="size-4 mr-2" />
                  {t('Custom app')}
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <AgentPieceDialog tools={tools} onToolsUpdate={onToolsUpdate} />
    </>
  );
}

export default ToolsButton;
