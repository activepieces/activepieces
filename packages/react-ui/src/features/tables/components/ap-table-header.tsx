import { t } from 'i18next';
import {
  ArrowLeft,
  ChevronDown,
  RefreshCw,
  Import,
  Download,
  History,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EditableText from '@/components/ui/editable-text';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { agentHooks } from '@/features/agents/lib/agent-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { cn } from '@/lib/utils';
import { isNil, Permission, PopulatedAgent } from '@activepieces/shared';

import { AgentProfile } from './agent-profile';
import { AgentSetupDialog } from './agent-setup-dialog';
import { ApTableHistory } from './ap-table-history';
import { useTableState } from './ap-table-state-provider';
import { ImportCsvDialog } from './import-csv-dialog';
import { ApTableTriggers } from './ap-table-triggers';
import { AgentConfigure } from './agent-configure';

interface ApTableHeaderProps {
  onBack: () => void;
  agent: PopulatedAgent;
}

export const ApTableHeader = ({
  onBack,
  agent,
}: ApTableHeaderProps) => {
  const [isSaving, table, renameTable, updateAgent, selectedAgentRunId, runs, fields] =
    useTableState((state) => [
      state.isSaving,
      state.table,
      state.renameTable,
      state.updateAgent,
      state.selectedAgentRunId,
      state.runs,
      state.fields,
    ]);

  const { mutate: updateAgentSettings } = agentHooks.useUpdate(
    agent.id,
    updateAgent,
  );
  const [isImportCsvDialogOpen, setIsImportCsvDialogOpen] = useState(false);
  const [isEditingTableName, setIsEditingTableName] = useState(false);
  const [isAiAgentMode, setIsAiAgentMode] = useState(
    agent?.settings?.aiMode ?? false,
  );
  const [isAgentSetupDialogOpen, setIsAgentSetupDialogOpen] = useState(
    (agent?.settings?.aiMode && agent?.created === agent?.updated) ?? false,
  );
  const [isAgentConfigureOpen, setIsAgentConfigureOpen] = useState(
    agent?.settings?.aiMode ?? false,
  );
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTriggersOpen, setIsTriggersOpen] = useState(false);
  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );

  if (!agent?.id) {
    return null;
  }

  const exportTable = async () => {
    const { tablesApi } = await import('../lib/tables-api');
    const { tablesUtils } = await import('../lib/utils');
    const exportedTable = await tablesApi.export(table.id);
    tablesUtils.exportTables([exportedTable]);
  };

  const showAgentSetupDialog = (checked: boolean) => {
    if (checked && !isNil(agent) && agent.created === agent.updated) {
      setIsAgentSetupDialogOpen(true);
    } else {
      setIsAgentSetupDialogOpen(false);
    }
    setIsAiAgentMode(checked);
    if (agent) {
      updateAgentSettings({
        ...agent,
        settings: {
          ...agent.settings,
          aiMode: checked,
        },
      });
    }
  };

  return (
    <>
      <div className="flex items-center gap-1 justify-between p-4 w-full">
        <div className="flex items-center gap-1">
          <Button
            variant="basic"
            size={'icon'}
            className="text-foreground"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-1">
            <EditableText
              className="text-lg font-semibold hover:cursor-text"
              value={table?.name || t('Table Editor')}
              readonly={!userHasTableWritePermission}
              onValueChange={(newName) => {
                renameTable(newName);
              }}
              isEditing={isEditingTableName}
              setIsEditing={setIsEditingTableName}
              tooltipContent={
                userHasTableWritePermission ? t('Edit Table Name') : ''
              }
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem
                  onClick={() => setIsImportCsvDialogOpen(true)}
                >
                  <Import className="mr-2 h-4 w-4" />
                  {t('Import')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportTable}>
                  <Download className="mr-2 h-4 w-4" />
                  {t('Export')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <div className="flex items-center gap-2 text-muted-foreground animate-fade-in">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">{t('Saving...')}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 w-full justify-end">
        {agent.created !== agent.updated && agent.settings?.aiMode && (
          <>
            <div className={cn("flex items-center", !isNil(selectedAgentRunId) && "gap-4")}>
              <div className="flex items-center">
                <ApTableHistory
                  open={isHistoryOpen}
                  onOpenChange={setIsHistoryOpen}
                  trigger={
                      <History 
                        className="p-2 h-9 w-9 cursor-pointer rounded-lg text-muted-foreground hover:text-foreground transition-colors hover:bg-muted/50 hover:text-primary" 
                        onClick={() => setIsHistoryOpen(true)}
                      />
                  }
                />
                <ApTableTriggers
                  open={isTriggersOpen}
                  onOpenChange={setIsTriggersOpen}
                  trigger={
                      <Zap 
                        className="p-2 h-9 w-9 mr-2  cursor-pointer rounded-lg text-muted-foreground hover:text-foreground transition-colors hover:bg-muted/50 hover:text-primary" 
                        onClick={() => setIsTriggersOpen(true)}
                      />
                  }
                  updateAgent={updateAgent}
                />
              </div>
              
              <AgentConfigure
                open={isAgentConfigureOpen}
                setOpen={setIsAgentConfigureOpen}
                updateAgentInTable={updateAgent}
                fields={fields}
                trigger={
                  <AgentProfile
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    size="lg"
                    onClick={() => {
                      setIsAgentConfigureOpen(true);
                    }}
                    imageUrl={agent?.profilePictureUrl}
                    isRunning={!isNil(selectedAgentRunId)}
                    showSettingsOnHover={true}
                    isOpen={isAgentConfigureOpen}
                  />
                }
              />
            </div>
            <Separator orientation="vertical" className="h-8" />
          </>
        )}
        <AgentSetupDialog
          open={isAgentSetupDialogOpen}
          setOpen={setIsAgentSetupDialogOpen}
          agent={agent}
          updateAgent={updateAgent}
          setAgentConfigureOpen={setIsAgentConfigureOpen}
          setAiAgentMode={setIsAiAgentMode}
          trigger={
            <div className="flex items-center gap-3  py-2">
              <Switch
                checked={isAiAgentMode}
                colorWheel={true}
                onCheckedChange={(checked) => {
                  showAgentSetupDialog(checked);
                }}
              />
              <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-red-600 bg-clip-text text-transparent">
                AI Agent Mode
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-gradient-to-r from-purple-600 to-red-600 p-[1px] rounded-xs flex items-center justify-center">
                    <span className="bg-background text-[10px] font-medium px-1 rounded-xs font-semibold select-none cursor-help">
                      <span className="bg-gradient-to-r from-purple-600 to-red-600 bg-clip-text text-transparent">
                        BETA
                      </span>
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    AI Agent Mode permanently modifies your data. Make sure to backup before using this feature.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          }
        />
      </div>
      <ImportCsvDialog
        open={isImportCsvDialogOpen}
        setIsOpen={setIsImportCsvDialogOpen}
      />
    </>
  );
};
