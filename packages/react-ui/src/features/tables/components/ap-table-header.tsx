import { t } from 'i18next';
import {
  ArrowLeft,
  ChevronDown,
  RefreshCw,
  Import,
  Download,
  History,
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
import { agentHooks } from '@/features/agents/lib/agent-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { formatUtils } from '@/lib/utils';
import { isNil, Permission, PopulatedAgent } from '@activepieces/shared';

import { AgentProfile } from './agent-profile';
import { AgentSetupDialog } from './agent-setup-dialog';
import { useTableState } from './ap-table-state-provider';
import { ImportCsvDialog } from './import-csv-dialog';

interface ApTableHeaderProps {
  onBack: () => void;
  agent: PopulatedAgent;
  setIsAgentConfigureOpen: (isOpen: boolean) => void;
  setIsHistoryOpen: (isOpen: boolean) => void;
}

export const ApTableHeader = ({
  onBack,
  agent,
  setIsAgentConfigureOpen,
  setIsHistoryOpen,
}: ApTableHeaderProps) => {
  const [isSaving, table, renameTable, updateAgent, selectedAgentRunId, runs] =
    useTableState((state) => [
      state.isSaving,
      state.table,
      state.renameTable,
      state.updateAgent,
      state.selectedAgentRunId,
      state.runs,
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
      <div className="flex items-center gap-2 w-full justify-end">
        {agent.created !== agent.updated && agent.settings?.aiMode && (
          <>
            <div className="flex items-center gap-2">
              {runs && runs.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-fit px-2"
                  onClick={() => setIsHistoryOpen(true)}
                >
                  <div className="flex items-center gap-1">
                    <History className="h-4 w-4" />
                    <span>
                      last run:{' '}
                      {formatUtils.formatDate(
                        new Date(runs[runs.length - 1]?.created),
                      )}
                    </span>
                  </div>
                </Button>
              )}
              <AgentProfile
                className="cursor-pointer"
                size="lg"
                imageUrl={agent?.profilePictureUrl}
                isRunning={!isNil(selectedAgentRunId)}
                onClick={() => {
                  setIsAgentConfigureOpen(true);
                }}
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
            <div className="flex items-center gap-2">
              <Switch
                checked={isAiAgentMode}
                colorWheel={true}
                onCheckedChange={(checked) => {
                  showAgentSetupDialog(checked);
                }}
              />
              <span className="text-md bg-radial-colorwheel-purple-red bg-clip-text text-transparent">
                AI Agent Mode
              </span>
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
