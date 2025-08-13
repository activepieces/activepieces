import React, { useState, useCallback, useMemo } from 'react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { agentHooks } from '@/features/agents/lib/agent-hooks';
import { EditableColumn, PopulatedAgent } from '@activepieces/shared';

import { ClientField } from '../../lib/store/ap-tables-client-state';
import { useTableState } from '../ap-table-state-provider';

import { AgentConfigureContent } from './agent-configure-content';
import { ConfirmChangesDialog } from './confirm-changes-dialog';

type AgentConfig = {
  systemPrompt: string;
  triggerOnNewRow: boolean;
  triggerOnFieldUpdate: boolean;
  allowAgentCreateColumns: boolean;
  limitColumnEditing: boolean;
  selectedColumns: Set<EditableColumn>;
};

type AgentConfigureProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  updateAgentInTable: (agent: PopulatedAgent) => void;
  fields: ClientField[];
  trigger?: React.ReactNode;
  defaultSettings: string;
};

export const AgentConfigure: React.FC<AgentConfigureProps> = ({
  open,
  setOpen,
  fields,
  updateAgentInTable,
  trigger,
  defaultSettings,
}) => {
  const [showAddPieceDialog, setShowAddPieceDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [table] = useTableState((state) => [state.table]);

  const [config, setConfig] = useState<AgentConfig>({
    systemPrompt: table.agent?.systemPrompt || '',
    triggerOnNewRow: table.agent?.settings?.triggerOnNewRow ?? true,
    triggerOnFieldUpdate: table.agent?.settings?.triggerOnFieldUpdate ?? false,
    allowAgentCreateColumns:
      table.agent?.settings?.allowAgentCreateColumns ?? true,
    limitColumnEditing: table.agent?.settings?.limitColumnEditing ?? false,
    selectedColumns: new Set(table.agent?.settings?.editableColumns || []),
  });

  const [selectedAgentRunId] = useTableState((state) => [
    state.selectedAgentRunId,
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const isThereAnyChange = useMemo(() => {
    return (
      config.systemPrompt !== table.agent?.systemPrompt ||
      config.triggerOnNewRow !== table.agent?.settings?.triggerOnNewRow ||
      config.triggerOnFieldUpdate !==
        table.agent?.settings?.triggerOnFieldUpdate ||
      config.allowAgentCreateColumns !==
        table.agent?.settings?.allowAgentCreateColumns ||
      config.limitColumnEditing !== table.agent?.settings?.limitColumnEditing ||
      JSON.stringify(Array.from(config.selectedColumns)) !==
        JSON.stringify(Array.from(table.agent?.settings?.editableColumns || []))
    );
  }, [table.agent, config]);

  const { mutate: updateAgent } = agentHooks.useUpdate(
    table.agent?.id ?? '',
    updateAgentInTable,
  );

  const handleConfigChange = useCallback((updates: Partial<AgentConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleSave = useCallback(() => {
    if (!table.agent) return;

    setIsSaving(true);
    updateAgent(
      {
        ...table.agent,
        systemPrompt: config.systemPrompt,
        settings: {
          ...table.agent.settings,
          allowAgentCreateColumns: config.allowAgentCreateColumns,
          limitColumnEditing: config.limitColumnEditing,
          triggerOnNewRow: config.triggerOnNewRow,
          triggerOnFieldUpdate: config.triggerOnFieldUpdate,
          editableColumns: Array.from(config.selectedColumns),
        },
      },
      {
        onSuccess: () => {
          setIsSaving(false);
          setIsClosing(true);
          setTimeout(() => {
            setOpen(false);
            setIsClosing(false);
          }, 300);
        },
        onError: () => {
          setIsSaving(false);
        },
      },
    );
  }, [updateAgent, table.agent, config]);

  const handleClose = useCallback(() => {
    if (isThereAnyChange) {
      setShowConfirmDialog(true);
    } else {
      setIsClosing(true);
      setTimeout(() => {
        setOpen(false);
        setIsClosing(false);
      }, 300);
    }
  }, [isThereAnyChange, setOpen]);

  const handleDiscardChanges = useCallback(() => {
    setConfig({
      systemPrompt: table.agent?.systemPrompt || '',
      triggerOnNewRow: table.agent?.settings?.triggerOnNewRow ?? true,
      triggerOnFieldUpdate:
        table.agent?.settings?.triggerOnFieldUpdate ?? false,
      allowAgentCreateColumns:
        table.agent?.settings?.allowAgentCreateColumns ?? true,
      limitColumnEditing: table.agent?.settings?.limitColumnEditing ?? false,
      selectedColumns: new Set(table.agent?.settings?.editableColumns || []),
    });

    setShowConfirmDialog(false);
    setIsClosing(true);
    setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, 300);
  }, [table.agent, setOpen]);

  const handleSaveChanges = useCallback(() => {
    handleSave();
    setShowConfirmDialog(false);
  }, [handleSave]);

  if (!table.agent?.mcpId || !table.agent?.id) {
    return null;
  }

  const content = (
    <div>
      <Popover
        open={open}
        onOpenChange={(newOpen) => {
          if (!newOpen) {
            handleClose();
          } else {
            setOpen(true);
          }
        }}
      >
        <PopoverTrigger asChild>
          <div>{trigger}</div>
        </PopoverTrigger>
        <PopoverContent
          className={`w-[400px] max-h-[85vh] overflow-y-auto p-0 transition-opacity duration-200 ${
            isClosing ? 'opacity-0' : 'opacity-100'
          }`}
          align="end"
          side="bottom"
          sideOffset={8}
        >
          <AgentConfigureContent
            config={config}
            onConfigChange={handleConfigChange}
            showAddPieceDialog={showAddPieceDialog}
            onAddPieceDialogChange={setShowAddPieceDialog}
            isSaving={isSaving}
            selectedAgentRunId={selectedAgentRunId}
            onSave={handleSave}
            onClose={handleClose}
            updateAgentInTable={updateAgentInTable}
            fields={fields}
            defaultSettings={defaultSettings}
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  if (open) {
    return (
      <>
        {content}
        <ConfirmChangesDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          onSave={handleSaveChanges}
          onDiscard={handleDiscardChanges}
          isSaving={isSaving}
        />
      </>
    );
  }

  return (
    <>
      <Tooltip delayDuration={50}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>
          <p>Agent Settings</p>
        </TooltipContent>
      </Tooltip>

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
