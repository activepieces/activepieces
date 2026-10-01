import { t } from 'i18next';
import { FolderPlus, Sparkles, Table2, Upload, Workflow } from 'lucide-react';
import { useState } from 'react';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { LoadingSpinner } from '@/components/custom/spinner';
import { useEmbedding } from '@/components/providers/embed-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const CreateNewMenu = ({
  children,
  scope = 'root',
  align = 'end',
  showCreateFlow = true,
  userHasPermissionToWriteFlow,
  userHasPermissionToWriteTable,
  userHasPermissionToWriteFolder,
  isCreatingFlow = false,
  isCreatingTable = false,
  onCreateFlow,
  onCreateTable,
  onCreateFolder,
  onImportFlow,
  onImportTable,
  onSelectTemplate,
  onOpenChange,
}: CreateNewMenuProps) => {
  const { embedState } = useEmbedding();
  const [isOpen, setIsOpen] = useState(false);

  const showFolder =
    scope === 'root' && !embedState.hideFolders && !!onCreateFolder;
  const showTemplate = scope === 'root' && !!onSelectTemplate;
  const showImportFlow = !embedState.hideExportAndImportFlow;
  const showTables = !embedState.hideTables;
  const showImport = showImportFlow || showTables;
  const busy = isCreatingFlow || isCreatingTable;

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(next) => {
        if (busy && !next) return;
        setIsOpen(next);
        onOpenChange?.(next);
      }}
    >
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-52">
        {showCreateFlow && (
          <PermissionNeededTooltip hasPermission={userHasPermissionToWriteFlow}>
            <DropdownMenuItem
              disabled={!userHasPermissionToWriteFlow || busy}
              onSelect={(e) => {
                e.preventDefault();
                onCreateFlow();
              }}
            >
              {isCreatingFlow ? <LoadingSpinner /> : <Workflow />}
              {t('New flow')}
            </DropdownMenuItem>
          </PermissionNeededTooltip>
        )}

        {showTables && (
          <PermissionNeededTooltip
            hasPermission={userHasPermissionToWriteTable}
          >
            <DropdownMenuItem
              disabled={!userHasPermissionToWriteTable || busy}
              onSelect={(e) => {
                e.preventDefault();
                onCreateTable();
              }}
            >
              {isCreatingTable ? <LoadingSpinner /> : <Table2 />}
              {t('New table')}
            </DropdownMenuItem>
          </PermissionNeededTooltip>
        )}

        {showFolder && (
          <PermissionNeededTooltip
            hasPermission={userHasPermissionToWriteFolder}
          >
            <DropdownMenuItem
              disabled={!userHasPermissionToWriteFolder || busy}
              onClick={onCreateFolder}
            >
              <FolderPlus />
              {t('New folder')}
            </DropdownMenuItem>
          </PermissionNeededTooltip>
        )}

        {(showTemplate || showImport) && <DropdownMenuSeparator />}

        {showTemplate && (
          <PermissionNeededTooltip hasPermission={userHasPermissionToWriteFlow}>
            <DropdownMenuItem
              disabled={!userHasPermissionToWriteFlow || busy}
              onSelect={() => onSelectTemplate?.()}
            >
              <Sparkles />
              {t('Start from a template')}
            </DropdownMenuItem>
          </PermissionNeededTooltip>
        )}

        {showImportFlow && (
          <PermissionNeededTooltip hasPermission={userHasPermissionToWriteFlow}>
            <DropdownMenuItem
              disabled={!userHasPermissionToWriteFlow}
              onClick={onImportFlow}
            >
              <Upload />
              {t('Import flow')}
            </DropdownMenuItem>
          </PermissionNeededTooltip>
        )}

        {showTables && (
          <PermissionNeededTooltip
            hasPermission={userHasPermissionToWriteTable}
          >
            <DropdownMenuItem
              disabled={!userHasPermissionToWriteTable}
              onClick={onImportTable}
            >
              <Upload />
              {t('Import table')}
            </DropdownMenuItem>
          </PermissionNeededTooltip>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type CreateNewMenuProps = {
  children: React.ReactNode;
  scope?: 'root' | 'folder';
  align?: 'start' | 'end' | 'center';
  showCreateFlow?: boolean;
  userHasPermissionToWriteFlow: boolean;
  userHasPermissionToWriteTable: boolean;
  userHasPermissionToWriteFolder: boolean;
  isCreatingFlow?: boolean;
  isCreatingTable?: boolean;
  onCreateFlow: () => void;
  onCreateTable: () => void;
  onCreateFolder?: () => void;
  onImportFlow: () => void;
  onImportTable: () => void;
  onSelectTemplate?: () => void;
  onOpenChange?: (open: boolean) => void;
};

export type CreateInFolderKind =
  | 'flow'
  | 'table'
  | 'import-flow'
  | 'import-table';
