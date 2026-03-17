import {
  AgentKnowledgeBaseTool,
  AgentTool,
  AgentToolType,
  KnowledgeBaseSourceType,
} from '@activepieces/shared';
import { t } from 'i18next';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useKnowledgeBaseToolDialogStore } from '../stores/knowledge-base-tools';

type AgentKnowledgeBaseDialogProps = {
  tools: AgentTool[];
  onToolsUpdate: (tools: AgentTool[]) => void;
};

export function AgentKnowledgeBaseDialog({
  tools,
  onToolsUpdate,
}: AgentKnowledgeBaseDialogProps) {
  const { showAddKbDialog, editingKbTool, closeKbDialog } =
    useKnowledgeBaseToolDialogStore();

  return (
    <Dialog open={showAddKbDialog} onOpenChange={closeKbDialog}>
      <KnowledgeBaseDialogContent
        key={`kb-dialog-${showAddKbDialog}-${editingKbTool?.toolName ?? 'new'}`}
        tools={tools}
        onToolsUpdate={onToolsUpdate}
        editingKbTool={editingKbTool}
        closeKbDialog={closeKbDialog}
      />
    </Dialog>
  );
}

function KnowledgeBaseDialogContent({
  tools,
  onToolsUpdate,
  editingKbTool,
  closeKbDialog,
}: {
  tools: AgentTool[];
  onToolsUpdate: (tools: AgentTool[]) => void;
  editingKbTool: AgentKnowledgeBaseTool | null;
  closeKbDialog: () => void;
}) {
  const [sourceType, setSourceType] = useState<KnowledgeBaseSourceType>(
    editingKbTool?.sourceType ?? KnowledgeBaseSourceType.FILE,
  );
  const [toolName, setToolName] = useState(editingKbTool?.toolName ?? '');
  const [sourceId, setSourceId] = useState(editingKbTool?.sourceId ?? '');
  const [sourceName, setSourceName] = useState(
    editingKbTool?.sourceName ?? '',
  );

  const handleAdd = () => {
    if (!toolName.trim() || !sourceId.trim() || !sourceName.trim()) {
      toast.error(t('Please fill in all fields'));
      return;
    }

    const isDuplicate = tools.some(
      (tool) =>
        tool.toolName === toolName.trim() &&
        (!editingKbTool || editingKbTool.toolName !== toolName.trim()),
    );
    if (isDuplicate) {
      toast.error(t('A tool with this name already exists'));
      return;
    }

    const newTool: AgentKnowledgeBaseTool = {
      type: AgentToolType.KNOWLEDGE_BASE,
      toolName: toolName.trim(),
      sourceType,
      sourceId: sourceId.trim(),
      sourceName: sourceName.trim(),
    };

    if (editingKbTool) {
      const updatedTools = tools.map((tool) =>
        tool.type === AgentToolType.KNOWLEDGE_BASE &&
        tool.toolName === editingKbTool.toolName
          ? newTool
          : tool,
      );
      onToolsUpdate(updatedTools);
      toast(t('Knowledge source updated successfully'));
    } else {
      onToolsUpdate([...tools, newTool]);
      toast(t('Knowledge source added successfully'));
    }

    closeKbDialog();
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {editingKbTool
            ? t('Edit Knowledge Source')
            : t('Add Knowledge Source')}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>{t('Source Type')}</Label>
          <Select
            value={sourceType}
            onValueChange={(val) =>
              setSourceType(val as KnowledgeBaseSourceType)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={KnowledgeBaseSourceType.FILE}>
                {t('File (PDF, TXT, CSV)')}
              </SelectItem>
              <SelectItem value={KnowledgeBaseSourceType.TABLE}>
                {t('Table')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('Tool Name')}</Label>
          <Input
            value={toolName}
            onChange={(e) => setToolName(e.target.value)}
            placeholder={
              sourceType === KnowledgeBaseSourceType.FILE
                ? t('e.g., company_docs')
                : t('e.g., products_catalog')
            }
          />
          <p className="text-xs text-muted-foreground">
            {t(
              'A unique name for the agent to reference this knowledge source',
            )}
          </p>
        </div>

        <div className="space-y-2">
          <Label>{t('Display Name')}</Label>
          <Input
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder={
              sourceType === KnowledgeBaseSourceType.FILE
                ? t('e.g., Company Policy Documents')
                : t('e.g., Products Catalog')
            }
          />
        </div>

        <div className="space-y-2">
          <Label>
            {sourceType === KnowledgeBaseSourceType.FILE
              ? t('Knowledge Base File ID')
              : t('Table External ID')}
          </Label>
          <Input
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            placeholder={
              sourceType === KnowledgeBaseSourceType.FILE
                ? t('ID of the ingested knowledge base file')
                : t('External ID of the table')
            }
          />
          <p className="text-xs text-muted-foreground">
            {sourceType === KnowledgeBaseSourceType.FILE
              ? t(
                  'Upload and ingest a file first via the Knowledge Base API, then paste the file ID here',
                )
              : t(
                  'The external ID of an Activepieces table (found in table settings)',
                )}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={closeKbDialog}>
          {t('Cancel')}
        </Button>
        <Button onClick={handleAdd}>
          {editingKbTool ? t('Update') : t('Add')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
