import { t } from 'i18next';
import {
  Bot,
  FolderPlus,
  Loader2,
  Sparkles,
  Table2,
  Upload,
  Workflow,
} from 'lucide-react';
import { useState } from 'react';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
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
  userHasPermissionToWriteFlow,
  userHasPermissionToWriteTable,
  userHasPermissionToWriteFolder,
  isCreatingFlow = false,
  isCreatingTable = false,
  isCreatingAgent = false,
  userHasPermissionToWriteAgent = false,
  onCreateFlow,
  onCreateTable,
  onCreateAgent,
  onCreateFolder,
  onImportFlow,
  onImportTable,
  onSelectTemplate,
  onOpenChange,
}: CreateNewMenuProps) => {
  const { embedState } = useEmbedding();
  const [isOpen, setIsOpen] = useState(false);

  const showFolder = scope === 'root' && !embedState.hideFolders;
  const showTemplate = scope === 'root';
  const busy = isCreatingFlow || isCreatingTable || isCreatingAgent;

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
      <DropdownMenuContent align={align} className="w-48">
        <PermissionNeededTooltip hasPermission={userHasPermissionToWriteFlow}>
          <DropdownMenuItem
            disabled={!userHasPermissionToWriteFlow || busy}
            onSelect={(e) => {
              e.preventDefault();
              onCreateFlow();
            }}
            className="cursor-pointer"
          >
            {isCreatingFlow ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Workflow className="h-4 w-4 mr-2" />
            )}
            {isCreatingFlow ? t('Creating...') : t('New Flow')}
          </DropdownMenuItem>
        </PermissionNeededTooltip>

        {showTemplate && onSelectTemplate && (
          <PermissionNeededTooltip hasPermission={userHasPermissionToWriteFlow}>
            <DropdownMenuItem
              disabled={!userHasPermissionToWriteFlow || busy}
              onSelect={() => onSelectTemplate()}
              className="cursor-pointer"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {t('Start from Template')}
            </DropdownMenuItem>
          </PermissionNeededTooltip>
        )}

        {!embedState.hideTables && (
          <PermissionNeededTooltip
            hasPermission={userHasPermissionToWriteTable}
          >
            <DropdownMenuItem
              disabled={!userHasPermissionToWriteTable || busy}
              onSelect={(e) => {
                e.preventDefault();
                onCreateTable();
              }}
              className="cursor-pointer"
            >
              {isCreatingTable ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Table2 className="h-4 w-4 mr-2" />
              )}
              {isCreatingTable ? t('Creating...') : t('New Table')}
            </DropdownMenuItem>
          </PermissionNeededTooltip>
        )}

        {onCreateAgent && (
          <PermissionNeededTooltip
            hasPermission={userHasPermissionToWriteAgent}
          >
            <DropdownMenuItem
              disabled={!userHasPermissionToWriteAgent || busy}
              onSelect={(e) => {
                e.preventDefault();
                onCreateAgent();
              }}
              className="cursor-pointer"
            >
              {isCreatingAgent ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bot className="h-4 w-4 mr-2" />
              )}
              {isCreatingAgent ? t('Creating...') : t('New Agent')}
            </DropdownMenuItem>
          </PermissionNeededTooltip>
        )}

        {scope === 'folder' &&
          (!embedState.hideExportAndImportFlow || !embedState.hideTables) && (
            <>
              <DropdownMenuSeparator />
              {!embedState.hideExportAndImportFlow && (
                <PermissionNeededTooltip
                  hasPermission={userHasPermissionToWriteFlow}
                >
                  <DropdownMenuItem
                    disabled={!userHasPermissionToWriteFlow}
                    onClick={onImportFlow}
                    className="cursor-pointer"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {t('Import Flow')}
                  </DropdownMenuItem>
                </PermissionNeededTooltip>
              )}
              {!embedState.hideTables && (
                <PermissionNeededTooltip
                  hasPermission={userHasPermissionToWriteTable}
                >
                  <DropdownMenuItem
                    disabled={!userHasPermissionToWriteTable}
                    onClick={onImportTable}
                    className="cursor-pointer"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {t('Import Table')}
                  </DropdownMenuItem>
                </PermissionNeededTooltip>
              )}
            </>
          )}

        {showFolder && onCreateFolder && (
          <>
            <DropdownMenuSeparator />
            <PermissionNeededTooltip
              hasPermission={userHasPermissionToWriteFolder}
            >
              <DropdownMenuItem
                disabled={!userHasPermissionToWriteFolder || busy}
                onClick={onCreateFolder}
                className="cursor-pointer"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                {t('New Folder')}
              </DropdownMenuItem>
            </PermissionNeededTooltip>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type CreateNewMenuProps = {
  children: React.ReactNode;
  scope?: 'root' | 'folder';
  align?: 'start' | 'end' | 'center';
  userHasPermissionToWriteFlow: boolean;
  userHasPermissionToWriteTable: boolean;
  userHasPermissionToWriteFolder: boolean;
  isCreatingFlow?: boolean;
  isCreatingTable?: boolean;
  isCreatingAgent?: boolean;
  userHasPermissionToWriteAgent?: boolean;
  onCreateFlow: () => void;
  onCreateTable: () => void;
  onCreateAgent?: () => void;
  onCreateFolder?: () => void;
  onImportFlow: () => void;
  onImportTable: () => void;
  onSelectTemplate?: () => void;
  onOpenChange?: (open: boolean) => void;
};

export type CreateInFolderKind =
  | 'flow'
  | 'table'
  | 'agent'
  | 'import-flow'
  | 'import-table';
