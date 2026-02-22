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
import { useState } from 'react';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { useEmbedding } from '@/components/embed-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOwnerOptions } from '@/features/automations/hooks/use-owner-options';
import { formatUtils } from '@/lib/utils';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import {
  AppConnectionWithoutSensitiveData,
  FlowStatus,
} from '@activepieces/shared';

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

type MultiSelectFilterProps = {
  label: string;
  icon: React.ReactNode;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  searchable?: boolean;
};

const MultiSelectFilter = ({
  label,
  icon,
  options,
  selectedValues,
  onChange,
  searchable = false,
}: MultiSelectFilterProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const selectedLabels = selectedValues
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean);

  const filteredOptions =
    searchable && search
      ? options.filter((o) =>
          o.label.toLowerCase().includes(search.toLowerCase()),
        )
      : options;

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSearch('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 text-sm gap-2 whitespace-nowrap border-dashed"
        >
          {icon}
          <span>{label}</span>
          {selectedValues.length > 0 && (
            <div className="flex items-center gap-1 ml-1">
              <div className="h-4 w-px bg-border" />
              {selectedValues.length <= 2 ? (
                selectedLabels.map((labelText, idx) => (
                  <Badge
                    key={selectedValues[idx]}
                    variant="outline"
                    className="px-1.5 py-0 text-xs font-normal rounded-sm bg-muted"
                  >
                    {labelText}
                  </Badge>
                ))
              ) : (
                <Badge
                  variant="outline"
                  className="px-1.5 py-0 text-xs font-normal rounded-sm bg-muted"
                >
                  {selectedValues.length} selected
                </Badge>
              )}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        {searchable && (
          <div className="px-2 pt-2 pb-1 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t('Search...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-7 text-sm border-none shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
        )}
        <ScrollArea className="max-h-[300px]">
          <div className="p-2 space-y-1">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-4 text-sm text-center text-muted-foreground">
                {t('No results')}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
                  onClick={() => toggleValue(option.value)}
                >
                  <Checkbox
                    checked={selectedValues.includes(option.value)}
                    onCheckedChange={() => toggleValue(option.value)}
                  />
                  {option.icon}
                  <span className="text-sm flex-1 truncate">
                    {option.label}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        {selectedValues.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => onChange([])}
            >
              {t('Clear all')}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
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
              onChange={(e) => onSearchChange(e.target.value)}
              className="min-w-[220px] max-w-xs pl-8 pr-8"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
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
            onChange={onTypeFilterChange}
          />

          <MultiSelectFilter
            label={t('Status')}
            icon={<ToggleLeft className="h-4 w-4" />}
            options={statusOptions}
            selectedValues={statusFilter}
            onChange={onStatusFilterChange}
          />

          <MultiSelectFilter
            label={t('Connections')}
            icon={<Link2 className="h-4 w-4" />}
            options={connectionOptions}
            selectedValues={connectionFilter}
            onChange={onConnectionFilterChange}
            searchable
          />

          <MultiSelectFilter
            label={t('Owner')}
            icon={<User className="h-4 w-4" />}
            options={ownerOptions}
            selectedValues={ownerFilter}
            onChange={onOwnerFilterChange}
            searchable
          />

          {hasActiveFilters && (
            <Button
              variant="link"
              size="sm"
              className="h-9 text-sm gap-1 text-muted-foreground hover:text-foreground"
              onClick={onClearAllFilters}
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
