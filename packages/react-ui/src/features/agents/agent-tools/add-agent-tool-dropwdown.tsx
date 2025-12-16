import { t } from 'i18next';
import { Hammer, Workflow } from 'lucide-react';
import { useState } from 'react';

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
  children: React.ReactNode;
  align?: 'start' | 'end' | 'center';
};

export const AddToolDropdown = ({
  tools,
  disabled,
  onToolsUpdate,
  children,
  align,
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
        {children}
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align}>
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
            <Hammer className="size-4 me-2" />
            <span>{t('Piece tool')}</span>
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
            <span>{t('Flow tool')}</span>
          </DropdownMenuItem>
        </AgentFlowToolDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
