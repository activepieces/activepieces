import { KnowledgeBaseSourceType } from '@activepieces/shared';
import { Add01Icon, File02Icon, TableIcon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { useState } from 'react';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useKnowledgeBaseToolDialogStore } from '../stores/knowledge-base-tools';

type AddKnowledgeBaseDropdownProps = {
  disabled?: boolean;
  children?: React.ReactNode;
};

export const AddKnowledgeBaseDropdown = ({
  disabled,
  children,
}: AddKnowledgeBaseDropdownProps) => {
  const [open, setOpen] = useState(false);
  const { setShowAddKbDialog } = useKnowledgeBaseToolDialogStore();

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger disabled={disabled} asChild>
        {children ?? (
          <Button variant="outline" size="sm">
            <HugeiconsIcon icon={Add01Icon} className="size-4 mr-2" />
            {t('Add')}
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onSelect={() =>
            setShowAddKbDialog(true, undefined, KnowledgeBaseSourceType.FILE)
          }
        >
          <HugeiconsIcon icon={File02Icon} className="size-3.5 me-2" />
          <span>{t('Upload File')}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={() =>
            setShowAddKbDialog(true, undefined, KnowledgeBaseSourceType.TABLE)
          }
        >
          <HugeiconsIcon icon={TableIcon} className="size-3.5 me-2" />
          <span>{t('Connect Table')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
