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
import { AgentTool, AgentToolType } from '@activepieces/shared';

import { AgentFlowToolDialog } from './flow-tool-dialog';
import { AgentPieceDialog } from './piece-tool-dialog';

type AddAgentToolDropdownProps = {
  tools: AgentTool[];
  disabled?: boolean;
  onToolsUpdate: (tools: AgentTool[]) => void;
};

export const AddAgentToolDropdown = ({
  tools,
  disabled,
  onToolsUpdate,
}: AddAgentToolDropdownProps) => {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [showAddPieceDialog, setShowAddPieceDialog] = useState(false);
  const [showAddFlowDialog, setShowAddFlowDialog] = useState(false);

  return (
    <DropdownMenu
      modal={false}
      open={openDropdown}
      onOpenChange={setOpenDropdown}
    >
      <DropdownMenuTrigger disabled={disabled} asChild>
        <Button variant="basic">
          <span>{t('Add tool')}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <AgentPieceDialog
          tools={tools}
          open={showAddPieceDialog}
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
            onSelect={(e) => {
              e.preventDefault();
              setShowAddPieceDialog(true);
            }}
          >
            <Puzzle className="h-4 w-4 me-2" />
            <span>{t('From piece')}</span>
          </DropdownMenuItem>
        </AgentPieceDialog>
        <AgentFlowToolDialog
          open={showAddFlowDialog}
          selectedFlows={tools
            .filter((tool) => tool.type === AgentToolType.FLOW)
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
            onSelect={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowAddFlowDialog(true);
            }}
          >
            <Workflow className="h-4 w-4 me-2" />
            <span>{t('From flow')}</span>
          </DropdownMenuItem>
        </AgentFlowToolDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
