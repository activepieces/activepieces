import { t } from 'i18next';
import { Workflow, Trash2, EllipsisVertical } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { McpTool, Permission } from '@activepieces/shared';

type McpFlowToolProps = {
  tool: McpTool;
  removeTool: (toolId: string) => Promise<void>;
};

export const McpFlowTool = ({ tool, removeTool }: McpFlowToolProps) => {
  const [open, setOpen] = useState(false);
  const { checkAccess } = useAuthorization();
  const hasPermissionToWriteMcp = checkAccess(Permission.WRITE_MCP);
  const navigate = useNavigate();
  return (
    <div
      key={`flow-${tool.id}`}
      className="group flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={() => {
        navigate(`/flows/${tool.flow?.id}`);
      }}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Workflow className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-medium truncate">
            {tool.flow?.version?.displayName || t('Flow')}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground">1</span>
        </div>

        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            className="rounded-full p-2 hover:bg-muted cursor-pointer"
            asChild
          >
            <EllipsisVertical className="h-8 w-8" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            noAnimationOnOut={true}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <PermissionNeededTooltip hasPermission={hasPermissionToWriteMcp}>
              <ConfirmationDeleteDialog
                title={`${t('Delete')} ${tool.flow?.version?.displayName}`}
                message={t('Are you sure you want to delete this tool?')}
                mutationFn={() => removeTool(tool.id)}
                entityName={t('Tool')}
              >
                <DropdownMenuItem
                  disabled={!hasPermissionToWriteMcp}
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex cursor-pointer  flex-row gap-2 items-center">
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="text-destructive">{t('Delete')}</span>
                  </div>
                </DropdownMenuItem>
              </ConfirmationDeleteDialog>
            </PermissionNeededTooltip>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
