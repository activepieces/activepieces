import { t } from 'i18next';
import { ChevronDown, Puzzle, Workflow } from 'lucide-react';
import { useState } from 'react';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthorization } from '@/hooks/authorization-hooks';
import {
  McpTool,
  McpToolType,
  Permission,
  McpWithTools,
  McpToolRequest,
} from '@activepieces/shared';

import { McpFlowDialog } from './mcp-flow-tool-dialog';
import { McpPieceDialog } from './mcp-piece-tool-dialog';

type McpAddToolDropdownProps = {
  mcp: McpWithTools;
  tools: McpTool[];
  onToolsUpdate: (tools: McpToolRequest[]) => void;
};

export const McpAddToolDropdown = ({
  mcp,
  tools,
  onToolsUpdate,
}: McpAddToolDropdownProps) => {
  const { checkAccess } = useAuthorization();
  const doesUserHavePermissionToWriteMcp = checkAccess(Permission.WRITE_MCP);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [showAddPieceDialog, setShowAddPieceDialog] = useState(false);
  const [showAddFlowDialog, setShowAddFlowDialog] = useState(false);

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
          <Button disabled={!doesUserHavePermissionToWriteMcp} variant="basic">
            <span>{t('Add tool')}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <McpPieceDialog
            open={showAddPieceDialog}
            mcp={mcp}
            onToolsUpdate={(tools) => {
              onToolsUpdate(tools);
              setShowAddPieceDialog(false);
              setOpenDropdown(false);
            }}
            onClose={() => {
              setShowAddPieceDialog(false);
              setOpenDropdown(false);
            }}
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
          </McpPieceDialog>
          <McpFlowDialog
            mcp={mcp}
            open={showAddFlowDialog}
            selectedFlows={tools
              .filter((tool) => tool.type === McpToolType.FLOW)
              .map((tool) => tool.flowId!)}
            onToolsUpdate={(newTools) => {
              onToolsUpdate(newTools);
              setShowAddFlowDialog(false);
              setOpenDropdown(false);
            }}
            onClose={() => {
              setShowAddFlowDialog(false);
              setOpenDropdown(false);
            }}
            tools={tools}
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
