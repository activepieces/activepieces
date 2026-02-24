import { t } from 'i18next';
import {
  Filter,
  FolderPlus,
  Import,
  Link2,
  Loader2,
  Plus,
  Search,
  Table2,
  ToggleLeft,
  User,
  Workflow,
  X,
} from 'lucide-react';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useOwnerOptions } from '@/features/automations/hooks/use-owner-options';
import { formatUtils } from '@/lib/utils';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import {
  AppConnectionWithoutSensitiveData,
  FlowStatus,
} from '@activepieces/shared';
import { MultiSelectFilter } from './multi-select-filter';

type AutomationsFiltersProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  typeFilter: string[];
  onTypeFilterChange: (value: string[]) => void;
  statusFilter: string[];
  onStatusFilterChange: (value: string[]) => void;
  connectionFilter: string[];
  onConnectionFilterChange: (value: string[]) => void;
  ownerFilter: string[];
  onOwnerFilterChange: (value: string[]) => void;
  onFilterChange?: () => void;
  connections: AppConnectionWithoutSensitiveData[] | undefined;
  pieces: PieceMetadataModelSummary[] | undefined;
  userHasPermissionToWriteFlow: boolean;
  userHasPermissionToWriteTable: boolean;
  userHasPermissionToWriteFolder: boolean;
  onCreateFlow: () => void;
  onCreateTable: () => void;
  onCreateFolder: () => void;
  onImportFlow: () => void;
  onImportTable: () => void;
  onClearAllFilters: () => void;
  hasActiveFilters: boolean;
  isCreatingFlow?: boolean;
  isCreatingTable?: boolean;
};

export const AutomationsFilters = ({
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  connectionFilter,
  onConnectionFilterChange,
  ownerFilter,
  onOwnerFilterChange,
  onFilterChange,
  connections,
  pieces,
  userHasPermissionToWriteFlow,
  userHasPermissionToWriteTable,
  userHasPermissionToWriteFolder,
  onCreateFlow,
  onCreateTable,
  onCreateFolder,
  onImportFlow,
  onImportTable,
  onClearAllFilters,
  hasActiveFilters,
  isCreatingFlow = false,
  isCreatingTable = false,
}: AutomationsFiltersProps) => {
  const { embedState } = useEmbedding();
  const ownerOptions = useOwnerOptions();
  const typeOptions = [
    { value: 'flow', label: t('Flows') },
    { value: 'table', label: t('Tables') },
  ];

  const statusOptions = Object.values(FlowStatus).map((status) => ({
    value: status,
    label: formatUtils.convertEnumToHumanReadable(status),
  }));

  const connectionOptions = (connections || []).map((connection) => {
    const pieceIcon = pieces?.find(
      (p) => p.name === connection.pieceName,
    )?.logoUrl;
    return {
      value: connection.externalId,
      label: connection.displayName,
      icon: pieceIcon ? (
        <img src={pieceIcon} alt="" className="h-4 w-4 object-contain" />
      ) : undefined,
    };
  });

  return (
    <div className="overflow-x-auto mb-4">
      <div className="flex items-center justify-between gap-4 min-w-max">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('Search flows and tables...')}
              value={searchTerm}
              onChange={(e) => {
                onSearchChange(e.target.value);
                onFilterChange?.();
              }}
              className="min-w-[220px] max-w-xs pl-8 pr-8"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  onSearchChange('');
                  onFilterChange?.();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5 rounded-full bg-muted hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <MultiSelectFilter
            label={t('Type')}
            icon={<Filter className="h-4 w-4" />}
            options={typeOptions}
            selectedValues={typeFilter}
            onChange={(values) => {
              onTypeFilterChange(values);
              onFilterChange?.();
            }}
          />

          <MultiSelectFilter
            label={t('Status')}
            icon={<ToggleLeft className="h-4 w-4" />}
            options={statusOptions}
            selectedValues={statusFilter}
            onChange={(values) => {
              onStatusFilterChange(values);
              onFilterChange?.();
            }}
          />

          <MultiSelectFilter
            label={t('Connections')}
            icon={<Link2 className="h-4 w-4" />}
            options={connectionOptions}
            selectedValues={connectionFilter}
            onChange={(values) => {
              onConnectionFilterChange(values);
              onFilterChange?.();
            }}
            searchable
          />

          <MultiSelectFilter
            label={t('Owner')}
            icon={<User className="h-4 w-4" />}
            options={ownerOptions}
            selectedValues={ownerFilter}
            onChange={(values) => {
              onOwnerFilterChange(values);
              onFilterChange?.();
            }}
            searchable
          />

          {hasActiveFilters && (
            <Button
              variant="link"
              size="sm"
              className="h-9 text-sm gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => {
                onClearAllFilters();
                onFilterChange?.();
              }}
            >
              <X className="h-3.5 w-3.5" />
              {t('Clear all')}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!embedState.hideExportAndImportFlow && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 flex items-center gap-2"
                >
                  <Import className="h-4 w-4" />
                  {t('Import')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <PermissionNeededTooltip
                  hasPermission={userHasPermissionToWriteFlow}
                >
                  <DropdownMenuItem
                    disabled={!userHasPermissionToWriteFlow}
                    onClick={onImportFlow}
                    className="cursor-pointer"
                  >
                    <Workflow className="h-4 w-4 mr-2" />
                    {t('Import Flow')}
                  </DropdownMenuItem>
                </PermissionNeededTooltip>
                <PermissionNeededTooltip
                  hasPermission={userHasPermissionToWriteTable}
                >
                  <DropdownMenuItem
                    disabled={!userHasPermissionToWriteTable}
                    onClick={onImportTable}
                    className="cursor-pointer"
                  >
                    <Table2 className="h-4 w-4 mr-2" />
                    {t('Import Table')}
                  </DropdownMenuItem>
                </PermissionNeededTooltip>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu open={isCreatingFlow || isCreatingTable || undefined}>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="h-9 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {t('Create New')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToWriteFlow}
              >
                <DropdownMenuItem
                  disabled={
                    !userHasPermissionToWriteFlow ||
                    isCreatingFlow ||
                    isCreatingTable
                  }
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
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToWriteTable}
              >
                <DropdownMenuItem
                  disabled={
                    !userHasPermissionToWriteTable ||
                    isCreatingFlow ||
                    isCreatingTable
                  }
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
              {!embedState.hideFolders && (
                <>
                  <DropdownMenuSeparator />
                  <PermissionNeededTooltip
                    hasPermission={userHasPermissionToWriteFolder}
                  >
                    <DropdownMenuItem
                      disabled={
                        !userHasPermissionToWriteFolder ||
                        isCreatingFlow ||
                        isCreatingTable
                      }
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
        </div>
      </div>
    </div>
  );
};
