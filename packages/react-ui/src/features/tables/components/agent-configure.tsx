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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { ConfirmChangesDialog } from './confirm-changes-dialog';
import { useTableState } from './ap-table-state-provider';

const BUILT_IN_TOOLS: string[] = ['@activepieces/piece-tables'];

type AgentConfigureProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  updateAgent: (agent: PopulatedAgent) => void;
  fields: ClientField[];
  trigger?: React.ReactNode;
};

export const AgentConfigure: React.FC<AgentConfigureProps> = ({
  open,
  setOpen,
  fields,
  updateAgent,
  trigger,
}) => {
  const { t } = useTranslation();
  const [showAddPieceDialog, setShowAddPieceDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
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
  const { mutate: automateTableFirst3Rows } = agentHooks.useAutomate(
    table.id,
    getSelectedServerRecords(selectedRecords, records, serverRecords).slice(
      0,
      3,
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
      systemPrompt !== table.agent?.systemPrompt ||
      triggerOnNewRow !== table.agent?.settings?.triggerOnNewRow ||
      triggerOnFieldUpdate !== table.agent?.settings?.triggerOnFieldUpdate ||
      allowAgentCreateColumns !==
        table.agent?.settings?.allowAgentCreateColumns ||
      limitColumnEditing !== table.agent?.settings?.limitColumnEditing ||
      JSON.stringify(Array.from(selectedColumns)) !==
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

  const handleClose = useCallback(() => {
    if (isThereAnyChange) {
      setShowConfirmDialog(true);
    }
    setOpen(false);
  }, [isThereAnyChange, setOpen]);

  const handleDiscardChanges = useCallback(() => {
    setSystemPrompt(table.agent?.systemPrompt || '');
    setTriggerOnNewRow(table.agent?.settings?.triggerOnNewRow ?? true);
    setTriggerOnFieldUpdate(table.agent?.settings?.triggerOnFieldUpdate ?? false);
    setAllowAgentCreateColumns(table.agent?.settings?.allowAgentCreateColumns ?? true);
    setLimitColumnEditing(table.agent?.settings?.limitColumnEditing ?? false);
    setSelectedColumns(new Set(table.agent?.settings?.editableColumns || []));
    
    setShowConfirmDialog(false);
    setOpen(false);
  }, [table.agent, setOpen]);

  const handleSaveChanges = useCallback(() => {
    handleSave({
      systemPrompt,
      triggerOnNewRow,
      triggerOnFieldUpdate,
      allowAgentCreateColumns,
      limitColumnEditing,
      selectedColumns,
    });
    setShowConfirmDialog(false);
    setOpen(false);
  }, [
    systemPrompt,
    triggerOnNewRow,
    triggerOnFieldUpdate,
    allowAgentCreateColumns,
    limitColumnEditing,
    selectedColumns,
    handleSave,
    setOpen,
  ]);

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

  if (!table.agent?.mcpId || !table.agent?.id) {
    return null;
  }

  return (
    <>
      <Popover open={open} onOpenChange={handleClose}>
        <PopoverTrigger asChild>
          <div onClick={(e) => e.preventDefault()}>{trigger}</div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[500px] max-h-[85vh] overflow-y-auto p-0"
          align="end"
          side="bottom"
          sideOffset={8}
        >
          <div className="relative p-6">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="flex flex-col space-y-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold">Configure your AI Agent</h2>
              </div>

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
                      onClick={() => {
                        setShowAddPieceDialog(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add tool
                    </Button>
                  </McpPieceDialog>
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

              <div className="flex flex-row gap-2 justify-center pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    automateTableFirst3Rows();
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
                  disabled={!isThereAnyChange}
                >
                  {t('Save Changes')}
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <ConfirmChangesDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onSave={handleSaveChanges}
        onDiscard={handleDiscardChanges}
        isSaving={isSaving}
      />
    </>
  );
};
