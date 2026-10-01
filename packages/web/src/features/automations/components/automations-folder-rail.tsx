import { FolderDto } from '@activepieces/shared';
import { t } from 'i18next';
import {
  FolderPlus,
  Link,
  MoreHorizontal,
  Pencil,
  Star,
  Table2,
  Trash2,
  Upload,
  Workflow,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { CreateInFolderKind } from './create-new-menu';

export const AutomationsFolderRail = ({
  folders,
  totalCount,
  selectedFolderId,
  hideTables,
  isPinned,
  userHasPermissionToWriteFlow,
  userHasPermissionToWriteTable,
  userHasPermissionToWriteFolder,
  onSelect,
  onCreateFolder,
  onCreateInFolder,
  onRename,
  onDelete,
  onTogglePin,
}: AutomationsFolderRailProps) => {
  return (
    <nav
      aria-label={t('Folders')}
      className="flex w-52 shrink-0 flex-col gap-1 pt-0.5"
    >
      <RailItem
        label={t('All folders')}
        count={totalCount}
        active={selectedFolderId === null}
        onSelect={() => onSelect(null)}
      />
      {folders.map((folder) => (
        <RailItem
          key={folder.id}
          label={folder.displayName}
          count={
            folder.numberOfFlows + (hideTables ? 0 : folder.numberOfTables)
          }
          active={selectedFolderId === folder.id}
          onSelect={() => onSelect(folder.id)}
          menu={
            <FolderMenu
              folder={folder}
              isPinned={isPinned(folder.id)}
              userHasPermissionToWriteFlow={userHasPermissionToWriteFlow}
              userHasPermissionToWriteTable={userHasPermissionToWriteTable}
              userHasPermissionToWriteFolder={userHasPermissionToWriteFolder}
              onCreateInFolder={onCreateInFolder}
              onRename={() => onRename(folder)}
              onDelete={() => onDelete(folder)}
              onTogglePin={() => onTogglePin(folder.id)}
            />
          }
        />
      ))}
      {userHasPermissionToWriteFolder && (
        <button
          type="button"
          onClick={onCreateFolder}
          className="flex h-8 items-center gap-2 rounded-lg px-2 text-sm text-gray-11 outline-hidden transition-colors hover:bg-gray-3 hover:text-gray-12 focus-visible:ring-2 focus-visible:ring-accent-8 [&_svg]:size-4 [&_svg]:shrink-0"
        >
          <FolderPlus />
          {t('New folder')}
        </button>
      )}
    </nav>
  );
};

const RailItem = ({
  label,
  count,
  active,
  onSelect,
  menu,
}: {
  label: string;
  count: number | null;
  active: boolean;
  onSelect: () => void;
  menu?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        'group/rail relative flex h-8 items-center rounded-lg transition-colors hover:bg-gray-3 has-aria-expanded:bg-gray-3',
        active && 'bg-gray-4 hover:bg-gray-4',
      )}
    >
      <button
        type="button"
        aria-current={active ? 'true' : undefined}
        onClick={onSelect}
        className={cn(
          'flex h-full min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-left text-sm text-gray-11 outline-hidden focus-visible:ring-2 focus-visible:ring-accent-8',
          active && 'font-medium text-gray-12',
          menu && 'pr-9',
        )}
      >
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {count !== null && (
          <span
            className={cn(
              'text-xs text-gray-11 tabular-nums',
              menu &&
                'group-focus-within/rail:invisible group-hover/rail:invisible group-has-aria-expanded/rail:invisible',
            )}
          >
            {count}
          </span>
        )}
      </button>
      {menu && (
        <div className="invisible absolute right-1 flex group-focus-within/rail:visible group-hover/rail:visible group-has-aria-expanded/rail:visible">
          {menu}
        </div>
      )}
    </div>
  );
};

const FolderMenu = ({
  folder,
  isPinned,
  userHasPermissionToWriteFlow,
  userHasPermissionToWriteTable,
  userHasPermissionToWriteFolder,
  onCreateInFolder,
  onRename,
  onDelete,
  onTogglePin,
}: {
  folder: FolderDto;
  isPinned: boolean;
  userHasPermissionToWriteFlow: boolean;
  userHasPermissionToWriteTable: boolean;
  userHasPermissionToWriteFolder: boolean;
  onCreateInFolder: (folderId: string, kind: CreateInFolderKind) => void;
  onRename: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) => {
  const { embedState } = useEmbedding();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const showImportFlow = !embedState.hideExportAndImportFlow;
  const showTables = !embedState.hideTables;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={t('Folder actions')}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem
            disabled={!userHasPermissionToWriteFlow}
            onClick={() => onCreateInFolder(folder.id, 'flow')}
          >
            <Workflow />
            {t('New flow')}
          </DropdownMenuItem>
          {showTables && (
            <DropdownMenuItem
              disabled={!userHasPermissionToWriteTable}
              onClick={() => onCreateInFolder(folder.id, 'table')}
            >
              <Table2 />
              {t('New table')}
            </DropdownMenuItem>
          )}
          {showImportFlow && (
            <DropdownMenuItem
              disabled={!userHasPermissionToWriteFlow}
              onClick={() => onCreateInFolder(folder.id, 'import-flow')}
            >
              <Upload />
              {t('Import flow')}
            </DropdownMenuItem>
          )}
          {showTables && (
            <DropdownMenuItem
              disabled={!userHasPermissionToWriteTable}
              onClick={() => onCreateInFolder(folder.id, 'import-table')}
            >
              <Upload />
              {t('Import table')}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!userHasPermissionToWriteFolder}
            onClick={onRename}
          >
            <Pencil />
            {t('Rename')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onTogglePin}>
            <Star />
            {isPinned ? t('Remove from favorites') : t('Add to favorites')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('folder', folder.id);
              navigator.clipboard.writeText(url.toString());
              toast.success(t('Link copied'));
            }}
          >
            <Link />
            {t('Copy link')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={!userHasPermissionToWriteFolder}
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 />
            {t('Delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('Delete {name}?', { name: folder.displayName })}
        description={t('Deleting "{name}" cannot be undone.', {
          name: folder.displayName,
        })}
        confirmLabel={t('Delete')}
        onConfirm={async () => onDelete()}
      />
    </>
  );
};

type AutomationsFolderRailProps = {
  folders: FolderDto[];
  totalCount: number | null;
  selectedFolderId: string | null | undefined;
  hideTables: boolean;
  isPinned: (itemId: string) => boolean;
  userHasPermissionToWriteFlow: boolean;
  userHasPermissionToWriteTable: boolean;
  userHasPermissionToWriteFolder: boolean;
  onSelect: (folderId: string | null) => void;
  onCreateFolder: () => void;
  onCreateInFolder: (folderId: string, kind: CreateInFolderKind) => void;
  onRename: (folder: FolderDto) => void;
  onDelete: (folder: FolderDto) => void;
  onTogglePin: (folderId: string) => void;
};
