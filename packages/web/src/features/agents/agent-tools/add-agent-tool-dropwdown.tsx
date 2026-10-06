import { HammerIcon, WorkflowSquare02Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { useState } from 'react';

import { McpSvg } from '@/assets/img/custom/mcp';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useFlowToolDialogStore } from './stores/flows-tools';
import { useMcpToolDialogStore } from './stores/mcp-tools';
import { usePieceToolsDialogStore } from './stores/pieces-tools';

type AddAgentToolDropdownProps = {
  disabled?: boolean;
  children: React.ReactNode;
  align?: 'start' | 'end' | 'center';
};

export const AddToolDropdown = ({
  disabled,
  children,
  align,
}: AddAgentToolDropdownProps) => {
  const [openDropdown, setOpenDropdown] = useState(false);

  const { setShowAddFlowDialog } = useFlowToolDialogStore();
  const { openAddPieceToolDialog } = usePieceToolsDialogStore();
  const { setShowAddMcpDialog } = useMcpToolDialogStore();

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
        <DropdownMenuItem
          onSelect={() => openAddPieceToolDialog({ page: 'pieces-list' })}
        >
          <HugeiconsIcon icon={HammerIcon} className="size-3.5 me-2" />
          <span>{t('Piece tool')}</span>
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={() => setShowAddFlowDialog(true)}>
          <HugeiconsIcon
            icon={WorkflowSquare02Icon}
            className="size-3.5 me-2"
          />
          <span>{t('Flow tool')}</span>
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={() => setShowAddMcpDialog(true)}>
          <McpSvg className="size-3.5 me-2" />
          <span>{t('Mcp server')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
