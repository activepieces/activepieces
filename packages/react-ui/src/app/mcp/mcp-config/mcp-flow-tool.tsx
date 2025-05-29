import { t } from 'i18next';
import { Workflow, Trash2 } from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { McpTool, McpWithTools } from '@activepieces/shared';

type McpFlowToolProps = {
  mcp: McpWithTools;
  tool: McpTool;
  removeTool: (toolId: string) => Promise<void>;
};

export const McpFlowTool = ({ mcp, tool, removeTool }: McpFlowToolProps) => {
  return (
    <div
      key={`flow-${tool.id}`}
      className="group flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Workflow className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-medium truncate">
            {tool.flow?.version?.displayName || t('Flow')}
          </h3>
          <span className="text-xs text-muted-foreground">
            {tool.flow?.id || 'Unknown Flow'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground">1</span>
        </div>
        <ConfirmationDeleteDialog
          title={`${t('Delete')} ${tool.flow?.version?.displayName}`}
          message={t('Are you sure you want to delete this tool?')}
          mutationFn={() => removeTool(tool.id)}
          showToast={true}
          entityName={t('Tool')}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </ConfirmationDeleteDialog>
      </div>
    </div>
  );
};
