import {
  type FolderDto,
  type PopulatedFlow,
  type Table,
  UncategorizedFolderId,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Copy,
  Download,
  FolderInput,
  Pencil,
  Trash2,
  Ellipsis,
} from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { useEmbedding } from '@/components/providers/embed-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoveToFolderDialog } from '@/features/automations/components/move-to-folder-dialog';
import { RenameDialog } from '@/features/automations/components/rename-dialog';

import {
  type BrowseManageItem,
  useBrowseMutations,
} from './use-browse-mutations';

export function BrowseRowMenu({
  type,
  id,
  name,
  flow,
  table,
  folderId,
  folders,
  mutations,
}: {
  type: 'flow' | 'table';
  id: string;
  name: string;
  flow?: PopulatedFlow;
  table?: Table;
  folderId?: string | null;
  folders: FolderDto[];
  mutations: ReturnType<typeof useBrowseMutations>;
}) {
  const { embedState } = useEmbedding();
  const [action, setAction] = useState<'rename' | 'move' | 'delete' | null>(
    null,
  );
  const [renameValue, setRenameValue] = useState(name);
  const [moveTarget, setMoveTarget] = useState(
    folderId ?? UncategorizedFolderId,
  );

  const item: BrowseManageItem = { type, id };
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div onClick={stop} onPointerDown={stop}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t('More actions')}
            className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-data-[selected=true]:opacity-100"
          >
            <Ellipsis className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={stop}>
          <DropdownMenuItem
            onSelect={() => {
              setRenameValue(name);
              setAction('rename');
            }}
          >
            <Pencil className="mr-2 size-4" />
            {t('Rename')}
          </DropdownMenuItem>
          {!embedState.hideFolders && (
            <DropdownMenuItem
              onSelect={() => {
                setMoveTarget(folderId ?? UncategorizedFolderId);
                setAction('move');
              }}
            >
              <FolderInput className="mr-2 size-4" />
              {t('Move to folder')}
            </DropdownMenuItem>
          )}
          {type === 'flow' && flow && !embedState.hideDuplicateFlow && (
            <DropdownMenuItem onSelect={() => mutations.duplicateFlow(flow)}>
              <Copy className="mr-2 size-4" />
              {t('Duplicate')}
            </DropdownMenuItem>
          )}
          {!embedState.hideExportAndImportFlow && (
            <DropdownMenuItem
              onSelect={() => {
                if (type === 'flow' && flow) mutations.exportFlow(flow);
                else if (table) mutations.exportTable(table);
              }}
            >
              <Download className="mr-2 size-4" />
              {t('Export')}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => setAction('delete')}
          >
            <Trash2 className="mr-2 size-4" />
            {t('Delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameDialog
        open={action === 'rename'}
        onOpenChange={(open) => !open && setAction(null)}
        value={renameValue}
        onChange={setRenameValue}
        isRenaming={mutations.isRenaming}
        onConfirm={async () => {
          await mutations.renameItem(item, renameValue.trim());
          setAction(null);
        }}
      />

      <MoveToFolderDialog
        open={action === 'move'}
        onOpenChange={(open) => !open && setAction(null)}
        folders={folders}
        selectedFolderId={moveTarget}
        onFolderChange={setMoveTarget}
        isMoving={mutations.isMoving}
        onConfirm={async () => {
          await mutations.moveItem(item, moveTarget);
          setAction(null);
        }}
      />

      <ConfirmationDeleteDialog
        open={action === 'delete'}
        onOpenChange={(open) => !open && setAction(null)}
        title={t('Delete {name}', { name })}
        message={t('Are you sure you want to delete this {type}?', { type })}
        entityName={name}
        mutationFn={async () => {
          await mutations.deleteItem(item);
        }}
      />
    </div>
  );
}
