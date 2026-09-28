import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import {
  AppConnectionWithoutSensitiveData,
  FlowStatus,
  FolderDto,
} from '@activepieces/shared';
import {
  Add01Icon,
  Cancel01Icon,
  Download04Icon,
  FilterIcon,
  Folder01Icon,
  Link02Icon,
  Search01Icon,
  TableIcon,
  ToggleOffIcon,
  UserIcon,
  WorkflowSquare02Icon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { IconButton } from '@/components/custom/icon-button';
import { LogoPlate } from '@/components/custom/logo-plate';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useOwnerOptions } from '@/features/automations/hooks/use-owner-options';
import { TemplatesBrowseDialog } from '@/features/templates';
import { formatUtils } from '@/lib/format-utils';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

import { CreateNewMenu } from './create-new-menu';
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
  folderFilter: string[];
  onFolderFilterChange: (value: string[]) => void;
  onFilterChange?: () => void;
  folders: FolderDto[];
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
  folderFilter,
  onFolderFilterChange,
  onFilterChange,
  folders,
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
  const navigate = useNavigate();
  const { embedState } = useEmbedding();
  const ownerOptions = useOwnerOptions();
  const [isTemplatesBrowseDialogOpen, setIsTemplatesBrowseDialogOpen] =
    useState(false);
  const typeOptions = [
    { value: 'flow', label: t('Flows') },
    ...(embedState.hideTables ? [] : [{ value: 'table', label: t('Tables') }]),
  ];

  const statusOptions = Object.values(FlowStatus).map((status) => ({
    value: status,
    label: formatUtils.convertEnumToHumanReadable(status),
  }));

  const folderOptions = folders.map((folder) => ({
    value: folder.id,
    label: folder.displayName,
  }));

  const connectionOptions = (connections || []).map((connection) => {
    const pieceIcon = pieces?.find(
      (p) => p.name === connection.pieceName,
    )?.logoUrl;
    return {
      value: connection.externalId,
      label: connection.displayName,
      icon: pieceIcon ? (
        <LogoPlate src={pieceIcon} alt="" className="size-4 rounded-sm p-px" />
      ) : undefined,
    };
  });

  return (
    <>
      <div
        className={cn('overflow-x-auto mt-4 mb-4', DASHBOARD_CONTENT_PADDING_X)}
      >
        <div className="flex items-center justify-between gap-4 min-w-max">
          <div className="flex items-center gap-2">
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-11"
              />
              <Input
                placeholder={
                  embedState.hideTables
                    ? t('Search flows...')
                    : t('Search flows and tables...')
                }
                value={searchTerm}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  onFilterChange?.();
                }}
                className="min-w-[300px] max-w-xs pl-8 pr-8 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    onSearchChange('');
                    onFilterChange?.();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5 rounded-full bg-gray-3 hover:bg-gray-4 text-gray-11 hover:text-gray-12 transition-colors"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="h-3 w-3" />
                </button>
              )}
            </div>

            <MultiSelectFilter
              label={t('Type')}
              icon={<HugeiconsIcon icon={FilterIcon} className="h-4 w-4" />}
              options={typeOptions}
              selectedValues={typeFilter}
              onChange={(values) => {
                onTypeFilterChange(values);
                onFilterChange?.();
              }}
            />

            <MultiSelectFilter
              label={t('Status')}
              icon={<HugeiconsIcon icon={ToggleOffIcon} className="h-4 w-4" />}
              options={statusOptions}
              selectedValues={statusFilter}
              onChange={(values) => {
                onStatusFilterChange(values);
                onFilterChange?.();
              }}
            />

            <MultiSelectFilter
              label={t('Connections')}
              icon={<HugeiconsIcon icon={Link02Icon} className="h-4 w-4" />}
              options={connectionOptions}
              selectedValues={connectionFilter}
              onChange={(values) => {
                onConnectionFilterChange(values);
                onFilterChange?.();
              }}
              searchable
            />

            {!embedState.isEmbedded && (
              <MultiSelectFilter
                label={t('Owner')}
                icon={<HugeiconsIcon icon={UserIcon} className="h-4 w-4" />}
                options={ownerOptions}
                selectedValues={ownerFilter}
                onChange={(values) => {
                  onOwnerFilterChange(values);
                  onFilterChange?.();
                }}
                searchable
              />
            )}

            {folderOptions.length > 0 && (
              <MultiSelectFilter
                label={t('Folder')}
                icon={<HugeiconsIcon icon={Folder01Icon} className="h-4 w-4" />}
                options={folderOptions}
                selectedValues={folderFilter}
                onChange={(values) => {
                  onFolderFilterChange(values);
                  onFilterChange?.();
                }}
                searchable
              />
            )}

            {hasActiveFilters && (
              <Button
                variant="link"
                size="sm"
                className="h-9 text-sm gap-1 text-gray-11 hover:text-gray-12"
                onClick={() => {
                  onClearAllFilters();
                  onFilterChange?.();
                }}
              >
                <HugeiconsIcon icon={Cancel01Icon} className="h-3.5 w-3.5" />
                {t('Clear all')}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!embedState.hideExportAndImportFlow && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton
                    icon={Download04Icon}
                    variant="outline"
                    size="sm"
                    className="h-9"
                  >
                    {t('Import')}
                  </IconButton>
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
                      <HugeiconsIcon
                        icon={WorkflowSquare02Icon}
                        className="h-4 w-4 mr-2"
                      />
                      {t('Import Flow')}
                    </DropdownMenuItem>
                  </PermissionNeededTooltip>
                  {!embedState.hideTables && (
                    <PermissionNeededTooltip
                      hasPermission={userHasPermissionToWriteTable}
                    >
                      <DropdownMenuItem
                        disabled={!userHasPermissionToWriteTable}
                        onClick={onImportTable}
                        className="cursor-pointer"
                      >
                        <HugeiconsIcon
                          icon={TableIcon}
                          className="h-4 w-4 mr-2"
                        />
                        {t('Import Table')}
                      </DropdownMenuItem>
                    </PermissionNeededTooltip>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <CreateNewMenu
              scope="root"
              align="end"
              userHasPermissionToWriteFlow={userHasPermissionToWriteFlow}
              userHasPermissionToWriteTable={userHasPermissionToWriteTable}
              userHasPermissionToWriteFolder={userHasPermissionToWriteFolder}
              isCreatingFlow={isCreatingFlow}
              isCreatingTable={isCreatingTable}
              onCreateFlow={onCreateFlow}
              onCreateTable={onCreateTable}
              onCreateFolder={onCreateFolder}
              onImportFlow={onImportFlow}
              onImportTable={onImportTable}
              onSelectTemplate={() => {
                if (embedState.isEmbedded) {
                  setIsTemplatesBrowseDialogOpen(true);
                } else {
                  navigate('/templates');
                }
              }}
            >
              <IconButton icon={Add01Icon} size="sm" className="h-9">
                {t('Create New')}
              </IconButton>
            </CreateNewMenu>
          </div>
        </div>
      </div>
      <TemplatesBrowseDialog
        open={isTemplatesBrowseDialogOpen}
        onOpenChange={setIsTemplatesBrowseDialogOpen}
      />
    </>
  );
};
