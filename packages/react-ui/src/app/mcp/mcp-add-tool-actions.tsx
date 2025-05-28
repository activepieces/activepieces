import { t } from 'i18next';
import { ChevronDown, Puzzle, Workflow } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { McpTool, McpToolType, Permission } from '@activepieces/shared';

import McpFlowDialog from './mcp-flow-tool-dialog/mcp-flow-dialog';
import McpToolDialog from './mcp-piece-tool-dialog/mcp-tool-dialog';

type McpAddToolDropdownProps = {
  mcpId: string;
  refetchMcp: () => void;
  showAddPieceDialog: boolean;
  setShowAddPieceDialog: (show: boolean) => void;
  showAddFlowDialog: boolean;
  setShowAddFlowDialog: (show: boolean) => void;
  tools: McpTool[];
};

export const McpAddToolDropdown = ({
  mcpId,
  refetchMcp,
  showAddPieceDialog,
  setShowAddPieceDialog,
  showAddFlowDialog,
  setShowAddFlowDialog,
  tools,
}: McpAddToolDropdownProps) => {
  const { checkAccess } = useAuthorization();
  const doesUserHavePermissionToWriteMcp = checkAccess(Permission.WRITE_MCP);
  const [openDropdown, setOpenDropdown] = useState(false);
  return (
    <PermissionNeededTooltip hasPermission={doesUserHavePermissionToWriteMcp}>
      <DropdownMenu
        modal={false}
        open={openDropdown}
        onOpenChange={setOpenDropdown}
      >
        <DropdownMenuTrigger
          disabled={!doesUserHavePermissionToWriteMcp}
          asChild
        >
          <Button
            disabled={!doesUserHavePermissionToWriteMcp}
            variant="default"
          >
            <span>{t('Add tool')}</span>
            <ChevronDown className="h-4 w-4 ml-2 " />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <McpToolDialog
            mcpId={mcpId!}
            open={showAddPieceDialog}
            mode="add"
            onSuccess={() => {
              refetchMcp();
              setShowAddPieceDialog(false);
            }}
            onClose={() => setShowAddPieceDialog(false)}
          >
            <DropdownMenuItem
              disabled={!doesUserHavePermissionToWriteMcp}
              onSelect={(e) => {
                e.preventDefault();
                setShowAddPieceDialog(true);
              }}
            >
              <Puzzle className="h-4 w-4 me-2" />
              <span>{t('From piece')}</span>
            </DropdownMenuItem>
          </McpToolDialog>
          <McpFlowDialog
            mcpId={mcpId!}
            open={showAddFlowDialog}
            mode="add"
            selectedFlows={tools
              .filter((tool) => tool.type === McpToolType.FLOW)
              .map((tool) => tool.flowId!)}
            onSuccess={() => {
              refetchMcp();
              setShowAddFlowDialog(false);
              setOpenDropdown(false);
            }}
            onClose={() => {
              setShowAddFlowDialog(false);
              setOpenDropdown(false);
            }}
          >
            <DropdownMenuItem
              disabled={!doesUserHavePermissionToWriteMcp}
              onSelect={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowAddFlowDialog(true);
              }}
            >
              <Workflow className="h-4 w-4 me-2" />
              <span>{t('From flow')}</span>
            </DropdownMenuItem>
          </McpFlowDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </PermissionNeededTooltip>
  );
};
