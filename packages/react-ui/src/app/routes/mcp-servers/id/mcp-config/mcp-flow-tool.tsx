import { t } from 'i18next';
import { Workflow, Trash2, EllipsisVertical } from 'lucide-react';
import { useState } from 'react';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthorization } from '@/hooks/authorization-hooks';
import {
  McpFlowTool as McpFlowToolType,
  Permission,
} from '@activepieces/shared';

type McpFlowToolProps = {
  tool: McpFlowToolType;
  removeTool: (toolIds: string[]) => Promise<void>;
};

export const McpFlowTool = ({ tool, removeTool }: McpFlowToolProps) => {
  const [open, setOpen] = useState(false);
  const { checkAccess } = useAuthorization();
  const hasPermissionToWriteMcp = checkAccess(Permission.WRITE_MCP);

  const openFlow = () => {
    window.open(`/flows/${tool.flow?.id}`, '_blank');
  };

  return (
    <Card key={`flow-${tool.id}`}>
      <CardContent className="flex items-center justify-between p-3 min-h-[48px]">
        <div
          className="flex items-center gap-3 min-w-0 group cursor-pointer"
          onClick={openFlow}
        >
          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
            <Workflow className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium truncate">
              <span className="group-hover:underline">
                {tool.flow?.version?.displayName || t('Flow')}
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
                  mutationFn={async () => await removeTool([tool.id])}
                  entityName={t('Tool')}
                >
                  <DropdownMenuItem
                    disabled={!hasPermissionToWriteMcp}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div className="flex cursor-pointer flex-row gap-2 items-center">
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="text-destructive">{t('Delete')}</span>
                    </div>
                  </DropdownMenuItem>
                </ConfirmationDeleteDialog>
              </PermissionNeededTooltip>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};
