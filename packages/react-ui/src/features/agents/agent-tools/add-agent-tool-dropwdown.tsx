import { t } from 'i18next';
import { Hammer, Workflow } from 'lucide-react';
import { useState } from 'react';

import { McpSvg } from '@/assets/img/custom/mcp';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useAgentToolsStore } from './store';

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

  const { setShowAddFlowDialog, openPieceDialog, setShowAddMcpDialog } =
    useAgentToolsStore();

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
          onSelect={() => openPieceDialog({ defaultPage: 'pieces-list' })}
        >
          <Hammer className="size-3.5 me-2" />
          <span>{t('Piece tool')}</span>
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={() => setShowAddFlowDialog(true)}>
          <Workflow className="size-3.5 me-2" />
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
