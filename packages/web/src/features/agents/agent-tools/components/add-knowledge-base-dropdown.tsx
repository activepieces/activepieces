import { KnowledgeBaseSourceType } from '@activepieces/shared';
import { t } from 'i18next';
import { FileText, Plus, Table2 } from 'lucide-react';
import { useState } from 'react';

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
};

export const AddKnowledgeBaseDropdown = ({
  disabled,
}: AddKnowledgeBaseDropdownProps) => {
  const [open, setOpen] = useState(false);
  const { setShowAddKbDialog } = useKnowledgeBaseToolDialogStore();

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger disabled={disabled} asChild>
        <Button variant="outline" size="sm">
          <Plus className="size-4 mr-2" />
          {t('Add')}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onSelect={() =>
            setShowAddKbDialog(true, undefined, KnowledgeBaseSourceType.FILE)
          }
        >
          <FileText className="size-3.5 me-2" />
          <span>{t('Upload File')}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={() =>
            setShowAddKbDialog(true, undefined, KnowledgeBaseSourceType.TABLE)
          }
        >
          <Table2 className="size-3.5 me-2" />
          <span>{t('Connect Table')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
