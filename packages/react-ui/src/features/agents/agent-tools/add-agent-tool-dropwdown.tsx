import { t } from 'i18next';
import { Hammer, Workflow } from 'lucide-react';
import { useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type AddAgentToolDropdownProps = {
  disabled?: boolean;
  children: React.ReactNode;
  align?: 'start' | 'end' | 'center';
  setShowAddFlowDialog: (show: boolean) => void;
  setShowAddPieceDialog: (show: boolean) => void;
};

export const AddToolDropdown = ({
  disabled,
  children,
  setShowAddFlowDialog,
  setShowAddPieceDialog,
  align,
}: AddAgentToolDropdownProps) => {
  const [openDropdown, setOpenDropdown] = useState(false);

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
        <DropdownMenuItem onSelect={() => setShowAddPieceDialog(true)}>
          <Hammer className="size-4 me-2" />
          <span>{t('Piece tool')}</span>
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={() => setShowAddFlowDialog(true)}>
          <Workflow className="h-4 w-4 me-2" />
          <span>{t('Flow tool')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
