import { t } from 'i18next';
import { Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

import { ClientField } from '../stores/store/ap-tables-client-state';

import { useTableState } from './ap-table-state-provider';

type FieldMenuTarget = {
  field: ClientField & { index: number };
  anchor: DOMRect;
};

function RenameFieldDialog({
  target,
  open,
  onOpenChange,
}: {
  target: FieldMenuTarget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const renameField = useTableState((state) => state.renameField);
  const [name, setName] = useState(target.field.name);
  const save = () => {
    const trimmed = name.trim();
    if (trimmed.length > 0 && trimmed !== target.field.name) {
      renameField(target.field.index, trimmed);
    }
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Rename Field')}</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              save();
            }
          }}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button onClick={save}>{t('Save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FieldActionsMenu({
  target,
  onClose,
}: {
  target: FieldMenuTarget | null;
  onClose: () => void;
}) {
  const deleteField = useTableState((state) => state.deleteField);
  const [isRenaming, setIsRenaming] = useState(false);

  if (!target) {
    return null;
  }

  return (
    <>
      <DropdownMenu
        open={!isRenaming}
        onOpenChange={(open) => {
          if (!open && !isRenaming) {
            onClose();
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          <div
            style={{
              position: 'fixed',
              left: target.anchor.left,
              top: target.anchor.bottom,
              width: 0,
              height: 0,
            }}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 rounded-sm">
          <DropdownMenuItem onSelect={() => setIsRenaming(true)}>
            <Edit2 className="mr-2 h-4 w-4" />
            {t('Rename')}
          </DropdownMenuItem>
          <ConfirmationDeleteDialog
            title={t('Delete Field')}
            message={t(
              'This will permanently delete the field and all its values.',
            )}
            entityName={t('field')}
            buttonText={t('Delete')}
            mutationFn={async () => {
              deleteField(target.field.index);
              onClose();
            }}
          >
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('Delete')}
            </DropdownMenuItem>
          </ConfirmationDeleteDialog>
        </DropdownMenuContent>
      </DropdownMenu>
      {isRenaming && (
        <RenameFieldDialog
          target={target}
          open={isRenaming}
          onOpenChange={(open) => {
            setIsRenaming(open);
            if (!open) {
              onClose();
            }
          }}
        />
      )}
    </>
  );
}
