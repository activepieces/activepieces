import { t } from 'i18next';
import {
  Filter,
  FolderPlus,
  Import,
  Link2,
  Loader2,
  Plus,
  Table2,
  ToggleLeft,
  User,
  Workflow,
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
import { formatUtils } from '@/lib/utils';
import { ProjectMemberWithUser } from '@activepieces/ee-shared';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import {
  AppConnectionWithoutSensitiveData,
  FlowStatus,
  UserWithBadges,
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
  projectMembers: ProjectMemberWithUser[] | undefined;
  pieces: PieceMetadataModelSummary[] | undefined;
  currentUser: UserWithBadges | null | undefined;
  userHasPermissionToWriteFlow: boolean;
  userHasPermissionToWriteTable: boolean;
  userHasPermissionToWriteFolder: boolean;
  onCreateFlow: () => void;
  onCreateTable: () => void;
  onCreateFolder: () => void;
  onImportFlow: () => void;
  onImportTable: () => void;
  isCreatingFlow?: boolean;
  isCreatingTable?: boolean;
};

type MultiSelectFilterProps = {
  label: string;
  icon: React.ReactNode;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
};

const MultiSelectFilter = ({
  label,
  icon,
  options,
  selectedValues,
  onChange,
}: MultiSelectFilterProps) => {
  const [open, setOpen] = useState(false);

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        <ScrollArea className="max-h-[300px]">
          <div className="p-2 space-y-1">
            {options.map((option) => (
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
                <span className="text-sm flex-1 truncate">{option.label}</span>
              </div>
            ))}
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
  projectMembers,
  pieces,
  currentUser,
  userHasPermissionToWriteFlow,
  userHasPermissionToWriteTable,
  userHasPermissionToWriteFolder,
  onCreateFlow,
  onCreateTable,
  onCreateFolder,
  onImportFlow,
  onImportTable,
  isCreatingFlow = false,
  isCreatingTable = false,
}: AutomationsFiltersProps) => {
  const { embedState } = useEmbedding();
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

  const ownerOptions = (() => {
    const options: { value: string; label: string }[] = [];
    const seenIds = new Set<string>();

    if (currentUser) {
      options.push({
        value: currentUser.id,
        label: `${currentUser.firstName} ${currentUser.lastName}`,
      });
      seenIds.add(currentUser.id);
    }

    (projectMembers || []).forEach((member) => {
      if (!seenIds.has(member.userId)) {
        options.push({
          value: member.userId,
          label: `${member.user.firstName} ${member.user.lastName}`,
        });
        seenIds.add(member.userId);
      }
    });

    return options;
  })();

  return (
    <div className="overflow-x-auto mb-4">
      <div className="flex items-center justify-between gap-4 min-w-max">
        <div className="flex items-center gap-2">
          <Input
            placeholder={t('Search flows and tables...')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="min-w-[200px] max-w-xs"
          />

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
          />

          <MultiSelectFilter
            label={t('Owner')}
            icon={<User className="h-4 w-4" />}
            options={ownerOptions}
            selectedValues={ownerFilter}
            onChange={onOwnerFilterChange}
          />
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
                  disabled={!userHasPermissionToWriteFlow || isCreatingFlow || isCreatingTable}
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
                  disabled={!userHasPermissionToWriteTable || isCreatingFlow || isCreatingTable}
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
                      disabled={!userHasPermissionToWriteFolder || isCreatingFlow || isCreatingTable}
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
