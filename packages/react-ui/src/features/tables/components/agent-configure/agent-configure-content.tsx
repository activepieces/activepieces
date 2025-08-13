import {
  BookOpen,
  Settings,
  Shield,
  X,
  RefreshCw,
  Trash2,
  Plus,
  WorkflowIcon,
  CircleUserRound,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { agentHooks } from '@/features/agents/lib/agent-hooks';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';
import { agentsApi } from '@/features/agents/lib/agents-api';
import { getSelectedServerRecords } from '@/features/tables/lib/utils';
import { cn } from '@/lib/utils';
import {
  isNil,
  EditableColumn,
  McpToolType,
  PopulatedAgent,
  McpToolRequest,
} from '@activepieces/shared';

import { McpPieceDialog } from '../../../mcp/components/mcp-piece-tool-dialog';
import { ClientField } from '../../lib/store/ap-tables-client-state';

import { AgentProfile } from '../agent-profile';
import { useTableState } from '../ap-table-state-provider';
import { Separator } from '@/components/ui/separator';

const BUILT_IN_TOOLS: string[] = ['@activepieces/piece-tables'];

type AgentConfig = {
  systemPrompt: string;
  triggerOnNewRow: boolean;
  triggerOnFieldUpdate: boolean;
  allowAgentCreateColumns: boolean;
  limitColumnEditing: boolean;
  selectedColumns: Set<EditableColumn>;
};

type AgentConfigureContentProps = {
  config: AgentConfig;
  onConfigChange: (updates: Partial<AgentConfig>) => void;
  showAddPieceDialog: boolean;
  onAddPieceDialogChange: (show: boolean) => void;
  isThereAnyChange: boolean;
  isSaving: boolean;
  selectedAgentRunId: string | null;
  onSave: () => void;
  onClose: () => void;
  updateAgentInTable: (agent: PopulatedAgent) => void;
  fields: ClientField[];
};

export const AgentConfigureContent: React.FC<AgentConfigureContentProps> = ({
  config,
  onConfigChange,
  showAddPieceDialog,
  onAddPieceDialogChange,
  isThereAnyChange,
  isSaving,
  selectedAgentRunId,
  onSave,
  onClose,
  updateAgentInTable,
  fields,
}) => {
  const { t } = useTranslation();
  const [table, serverRecords, selectedRecords, records] = useTableState(
    (state) => [
      state.table,
      state.serverRecords,
      state.selectedRecords,
      state.records,
    ],
  );

  const { mutate: automateTableFirst3Rows } = agentHooks.useAutomate(
    table.id,
    getSelectedServerRecords(selectedRecords, records, serverRecords).slice(
      0,
      3,
    ),
  );

  const { mutate: updateTools } = mcpHooks.useUpdateTools(
    table.agent?.mcpId || '',
    async () => {
      if (table.agent?.id) {
        const updatedAgent = await agentsApi.get(table.agent.id);
        updateAgentInTable(updatedAgent);
      }
    },
  );

  const { mutate: updateAgent } = agentHooks.useUpdate(
    table.agent?.id ?? '',
    updateAgentInTable,
  );

  const handleColumnToggle = (column: ClientField) => {
    const newSelected = new Set<EditableColumn>(config.selectedColumns);
    const existingColumn = Array.from(newSelected).find(
      (col) => col.fieldId === column.uuid,
    );
    if (existingColumn) {
      newSelected.delete(existingColumn);
    } else {
      newSelected.add({ name: column.name, fieldId: column.uuid });
    }

    onConfigChange({ selectedColumns: newSelected });
  };

  if (!table.agent?.mcpId || !table.agent?.id) {
    return null;
  }

  return (
    <div className="relative p-6">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="flex flex-col space-y-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Configure your AI Agent</h2>
        </div>

        <Accordion type="multiple" defaultValue={["instructions"]} className="w-full border-none">
          <AccordionItem value="avatar">
            <AccordionTrigger className="flex items-center gap-2 hover:no-underline px-0">
              <div className="flex items-center gap-2">
                <CircleUserRound className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Avatar</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex items-center gap-3 pt-2">
                <AgentProfile
                  size="xxl"
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
                    onClick={() => {
                      updateAgent({
                        ...table.agent,
                        generateNewProfilePicture: true,
                      });
                    }}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="instructions">
            <AccordionTrigger className="flex items-center gap-2 hover:no-underline px-0">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Instructions</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <Textarea
                  value={config.systemPrompt}
                  onChange={(e) => {
                    onConfigChange({ systemPrompt: e.target.value });
                  }}
                  placeholder="Write an SEO-friendly blog post using the keywords: {Keyword List}, based on the topic: {Content Idea}. Then write a LinkedIn post summarizing that blog post..."
                  className="min-h-[140px] border-primary/20"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tools">
            <AccordionTrigger className="flex items-center gap-2 hover:no-underline px-0">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Tools {table.agent?.mcp.tools.length > 0 ? `(${table.agent?.mcp.tools.length})` : ''}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
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
                  onToolsUpdate={(tools: McpToolRequest[]) => {
                    updateTools(tools);
                    onAddPieceDialogChange(false);
                  }}
                  onClose={() => {
                    onAddPieceDialogChange(false);
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      onAddPieceDialogChange(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add tool
                  </Button>
                </McpPieceDialog>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="permissions">
            <AccordionTrigger className="flex items-center gap-2 hover:no-underline px-0">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Permissions</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.allowAgentCreateColumns}
                    onCheckedChange={(value) => {
                      onConfigChange({ allowAgentCreateColumns: value });
                    }}
                  />
                  <span className="text-sm w-[250px]">
                    Allow agent to create new columns if needed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.limitColumnEditing}
                    onCheckedChange={(value) => {
                      onConfigChange({ limitColumnEditing: value });
                    }}
                  />
                  <span className="text-sm w-[250px]">
                    Limit editing to specific columns
                  </span>
                </div>

                {config.limitColumnEditing && (
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
                          onConfigChange({ selectedColumns: newSelected });
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
                          onConfigChange({ selectedColumns: newSelected });
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
                            checked={Array.from(config.selectedColumns).some(
                              (col) => col.fieldId === column.uuid,
                            )}
                            onCheckedChange={() => handleColumnToggle(column)}
                          />
                          <span
                            className={cn(
                              'text-sm font-light',
                              Array.from(config.selectedColumns).some(
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex flex-row gap-2 justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => {
              automateTableFirst3Rows();
            }}
          >
            Test first 5 rows
          </Button>
          <Button
            onClick={onSave}
            loading={!isNil(selectedAgentRunId) || isSaving}
            disabled={!isThereAnyChange}
          >
            {t('Save Changes')}
          </Button>
        </div>
      </div>
    </div>
  );
};
