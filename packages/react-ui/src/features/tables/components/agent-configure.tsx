import {
  BookOpen,
  Settings,
  Clock,
  Shield,
  X,
  RefreshCw,
  Upload,
  Trash2,
  Plus,
  WorkflowIcon,
} from 'lucide-react';
import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { agentHooks } from '@/features/agents/lib/agent-hooks';
import { agentsApi } from '@/features/agents/lib/agents-api';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';
import { getSelectedServerRecords } from '@/features/tables/lib/utils';
import { cn } from '@/lib/utils';
import {
  isNil,
  EditableColumn,
  McpToolType,
  PopulatedAgent,
} from '@activepieces/shared';

import { McpPieceDialog } from '../../mcp/components/mcp-piece-tool-dialog';
import { ClientField } from '../lib/store/ap-tables-client-state';

import { AgentProfile } from './agent-profile';
import { useTableState } from './ap-table-state-provider';

const BUILT_IN_TOOLS: string[] = [];

type AgentConfigureProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  updateAgent: (agent: PopulatedAgent) => void;
  fields: ClientField[];
};

export const AgentConfigure: React.FC<AgentConfigureProps> = ({
  open,
  setOpen,
  fields,
  updateAgent,
}) => {
  const { t } = useTranslation();
  const [showAddPieceDialog, setShowAddPieceDialog] = useState(false);
  const [table, serverRecords, selectedRecords, records] = useTableState(
    (state) => [
      state.table,
      state.serverRecords,
      state.selectedRecords,
      state.records,
    ],
  );
  const [systemPrompt, setSystemPrompt] = useState(
    table.agent?.systemPrompt || '',
  );
  const { mutate: automateTableFirst5Rows } = agentHooks.useAutomate(
    table.id,
    getSelectedServerRecords(selectedRecords, records, serverRecords).slice(
      0,
      5,
    ),
  );
  const [triggerOnNewRow, setTriggerOnNewRow] = useState(
    table.agent?.settings?.triggerOnNewRow ?? true,
  );
  const [triggerOnFieldUpdate, setTriggerOnFieldUpdate] = useState(
    table.agent?.settings?.triggerOnFieldUpdate ?? false,
  );
  const [allowAgentCreateColumns, setAllowAgentCreateColumns] = useState(
    table.agent?.settings?.allowAgentCreateColumns ?? true,
  );
  const [limitColumnEditing, setLimitColumnEditing] = useState(
    table.agent?.settings?.limitColumnEditing ?? false,
  );
  const [selectedColumns, setSelectedColumns] = useState<Set<EditableColumn>>(
    new Set(table.agent?.settings?.editableColumns || []),
  );
  const [selectedAgentRunId] = useTableState((state) => [
    state.selectedAgentRunId,
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const { mutate: updateTools } = mcpHooks.useUpdateTools(
    table.agent?.mcpId || '',
    async () => {
      if (table.agent?.id) {
        const updatedAgent = await agentsApi.get(table.agent.id);
        updateAgent(updatedAgent);
      }
    },
  );

  const isThereAnyChange = useMemo(() => {
    return (
      systemPrompt === table.agent?.systemPrompt &&
      triggerOnNewRow === table.agent?.settings?.triggerOnNewRow &&
      triggerOnFieldUpdate === table.agent?.settings?.triggerOnFieldUpdate &&
      allowAgentCreateColumns ===
        table.agent?.settings?.allowAgentCreateColumns &&
      limitColumnEditing === table.agent?.settings?.limitColumnEditing &&
      JSON.stringify(Array.from(selectedColumns)) ===
        JSON.stringify(Array.from(table.agent?.settings?.editableColumns || []))
    );
  }, [
    table.agent,
    systemPrompt,
    triggerOnNewRow,
    triggerOnFieldUpdate,
    allowAgentCreateColumns,
    limitColumnEditing,
    selectedColumns,
  ]);

  const { mutate: updateAgentSettings } = agentHooks.useUpdate(
    table.agent?.id ?? '',
    updateAgent,
  );

  const handleSave = useCallback(
    (values: {
      systemPrompt: string;
      triggerOnNewRow: boolean;
      triggerOnFieldUpdate: boolean;
      allowAgentCreateColumns: boolean;
      limitColumnEditing: boolean;
      selectedColumns: Set<EditableColumn>;
    }) => {
      if (!table.agent) return;

      setIsSaving(true);
      updateAgentSettings(
        {
          ...table.agent,
          systemPrompt: values.systemPrompt,
          settings: {
            ...table.agent.settings,
            allowAgentCreateColumns: values.allowAgentCreateColumns,
            limitColumnEditing: values.limitColumnEditing,
            triggerOnNewRow: values.triggerOnNewRow,
            triggerOnFieldUpdate: values.triggerOnFieldUpdate,
            editableColumns: Array.from(values.selectedColumns),
          },
        },
        {
          onSuccess: () => {
            setIsSaving(false);
          },
          onError: () => {
            setIsSaving(false);
          },
        },
      );
    },
    [updateAgentSettings, table.agent],
  );

  const handleColumnToggle = (column: ClientField) => {
    const newSelected = new Set<EditableColumn>(selectedColumns);
    const existingColumn = Array.from(newSelected).find(
      (col) => col.fieldId === column.uuid,
    );
    if (existingColumn) {
      newSelected.delete(existingColumn);
    } else {
      newSelected.add({ name: column.name, fieldId: column.uuid });
    }

    setSelectedColumns(newSelected);
  };

  if (!table.agent?.mcpId || !table.agent?.id || !open) {
    return null;
  }

  return (
    <div className="absolute right-0 top-0">
      <div className="flex bg-background flex-col h-[85vh] border items-center mt-4 mr-4 rounded-lg relative animate-in slide-in-from-right duration-100 ease-out ease-in">
        <div className="flex w-full pt-6 px-4 mb-3 justify-between">
          <h2 className="text-lg font-semibold">Configure your AI Agent</h2>
          <div className="flex items-center gap-2">
            {isSaving && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <LoadingSpinner className="h-4 w-4" />
                <span className="text-sm">Saving...</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 absolute right-2 top-1"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 flex flex-col p-4 pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">Instructions</h3>
            </div>
            <Textarea
              value={systemPrompt}
              onChange={(e) => {
                const newValue = e.target.value;
                setSystemPrompt(newValue);
              }}
              placeholder="Write an SEO-friendly blog post using the keywords: {Keyword List}, based on the topic: {Content Idea}. Then write a LinkedIn post summarizing that blog post..."
              className="min-h-[140px] border-primary/20"
            />
            <div className="flex items-center gap-3">
              <AgentProfile
                size="lg"
                imageUrl={table.agent?.profilePictureUrl}
              />
              <span className="text-sm font-medium">
                {table.agent?.displayName || 'Agent Name'}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-primary "
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-primary"
                >
                  <Upload className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">Tools</h3>
            </div>
            <div className="space-y-2">
              {table.agent?.mcp.tools
                .filter(
                  (tool) =>
                    tool.type === McpToolType.PIECE &&
                    !BUILT_IN_TOOLS.includes(tool.pieceMetadata.pieceName),
                )
                .map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-center gap-3 p-3 bg-muted rounded-sm"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-6 h-6 rounded flex items-center justify-center">
                        <span className="text-xs font-medium text-black">
                          {tool.type === McpToolType.PIECE && (
                            <img
                              src={tool.pieceMetadata.logoUrl}
                              alt={tool.pieceMetadata.actionDisplayName}
                              className="w-6 h-6"
                            />
                          )}
                          {tool.type === McpToolType.FLOW && (
                            <WorkflowIcon className="w-4 h-4" />
                          )}
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {tool.type === McpToolType.PIECE
                          ? tool.pieceMetadata.actionDisplayName
                          : tool.flow?.version?.displayName}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        updateTools(
                          table.agent?.mcp.tools?.filter(
                            (t) => t.id !== tool.id,
                          ) || [],
                        );
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              <McpPieceDialog
                open={showAddPieceDialog}
                mcp={table.agent.mcp}
                builtInPiecesTools={BUILT_IN_TOOLS}
                onToolsUpdate={(tools) => {
                  updateTools(tools);

                  setShowAddPieceDialog(false);
                }}
                onClose={() => {
                  setShowAddPieceDialog(false);
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowAddPieceDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add tool
                </Button>
              </McpPieceDialog>
            </div>
          </div>

          <div className="border-t border-border pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">Triggers</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              AI Agent will run every time
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={triggerOnNewRow}
                  onCheckedChange={(value) => {
                    setTriggerOnNewRow(value);
                  }}
                />
                <span className="text-sm">New row is added</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={triggerOnFieldUpdate}
                  onCheckedChange={(value) => {
                    setTriggerOnFieldUpdate(value);
                  }}
                />
                <span className="text-sm">Any field is updated</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">Permissions</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={allowAgentCreateColumns}
                  onCheckedChange={(value) => {
                    setAllowAgentCreateColumns(value);
                  }}
                />
                <span className="text-sm w-[250px]">
                  Allow agent to create new columns if needed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={limitColumnEditing}
                  onCheckedChange={(value) => {
                    setLimitColumnEditing(value);
                  }}
                />
                <span className="text-sm w-[250px]">
                  Limit editing to specific columns
                </span>
              </div>
            </div>

            {limitColumnEditing && (
              <div className="space-y-2 border rounded-sm p-3">
                <p className="text-sm text-muted-foreground w-[300px]">
                  Select the columns you want the agent to be able to modify
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newSelected = new Set(
                        fields.map((col) => ({
                          name: col.name,
                          fieldId: col.uuid,
                        })) || [],
                      );
                      setSelectedColumns(newSelected);
                    }}
                    className="text-xs p-0 hover:bg-transparent hover:text-primary"
                  >
                    Select all
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newSelected = new Set<EditableColumn>();
                      setSelectedColumns(newSelected);
                    }}
                    className="text-xs p-0 hover:bg-transparent hover:text-primary"
                  >
                    Select none
                  </Button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {fields.map((column) => (
                    <div key={column.uuid} className="flex items-center gap-2">
                      <Checkbox
                        checked={Array.from(selectedColumns).some(
                          (col) => col.fieldId === column.uuid,
                        )}
                        onCheckedChange={() => handleColumnToggle(column)}
                      />
                      <span
                        className={cn(
                          'text-sm font-light',
                          Array.from(selectedColumns).some(
                            (col) => col.fieldId === column.uuid,
                          )
                            ? 'text-primary'
                            : '',
                        )}
                      >
                        {column.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-row gap-2 justify-center px-4 pb-4 relative before:absolute before:inset-x-3 before:-top-6 before:h-24 before:bg-gradient-to-b before:from-white/70 before:via-white before:to-transparent before:pointer-events-none before:blur-sm">
          <Button
            variant="outline"
            className="z-10"
            onClick={() => {
              automateTableFirst5Rows();
            }}
          >
            Test first 5 rows
          </Button>
          <Button
            onClick={() => {
              handleSave({
                systemPrompt,
                triggerOnNewRow,
                triggerOnFieldUpdate,
                allowAgentCreateColumns,
                limitColumnEditing,
                selectedColumns,
              });
            }}
            loading={!isNil(selectedAgentRunId) || isSaving}
            disabled={isThereAnyChange}
            className="z-10"
          >
            {t('Save Changes')}
          </Button>
        </div>
      </div>
    </div>
  );
};
