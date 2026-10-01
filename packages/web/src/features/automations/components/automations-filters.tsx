import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import {
  AppConnectionWithoutSensitiveData,
  FlowStatus,
  FolderDto,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Filter,
  FolderIcon,
  Link2,
  Search,
  Table2,
  ToggleLeft,
  User,
  Workflow,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { LogoPlate } from '@/components/custom/logo-plate';
import { Toolbar, ToolbarSpacer } from '@/components/custom/page';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { DownloadIcon } from '@/components/icons/download';
import { PlusIcon } from '@/components/icons/plus';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useOwnerOptions } from '@/features/automations/hooks/use-owner-options';
import { TemplatesBrowseDialog } from '@/features/templates';
import { formatUtils } from '@/lib/format-utils';

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
        <LogoPlate src={pieceIcon} alt="" className="size-4 rounded-md p-px" />
      ) : undefined,
    };
  });

  return (
    <>
      <Toolbar>
        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="w-72">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
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
            />
            {searchTerm && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  onClick={() => {
                    onSearchChange('');
                    onFilterChange?.();
                  }}
                >
                  <X />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>

          <MultiSelectFilter
            label={t('Type')}
            icon={<Filter />}
            options={typeOptions}
            selectedValues={typeFilter}
            onChange={(values) => {
              onTypeFilterChange(values);
              onFilterChange?.();
            }}
          />

          <MultiSelectFilter
            label={t('Status')}
            icon={<ToggleLeft />}
            options={statusOptions}
            selectedValues={statusFilter}
            onChange={(values) => {
              onStatusFilterChange(values);
              onFilterChange?.();
            }}
          />

          <MultiSelectFilter
            label={t('Connections')}
            icon={<Link2 />}
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
              icon={<User />}
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
              icon={<FolderIcon />}
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
              variant="ghost"
              onClick={() => {
                onClearAllFilters();
                onFilterChange?.();
              }}
            >
              <X />
              {t('Clear all')}
            </Button>
          )}
        </div>

        <ToolbarSpacer />

        <div className="flex items-center gap-2">
          {!embedState.hideExportAndImportFlow && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <AnimatedIconButton
                  icon={DownloadIcon}
                  iconSize={16}
                  variant="outline"
                >
                  {t('Import')}
                </AnimatedIconButton>
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
                    <Workflow />
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
                      <Table2 />
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
            <AnimatedIconButton icon={PlusIcon} iconSize={16}>
              {t('Create New')}
            </AnimatedIconButton>
          </CreateNewMenu>
        </div>
      </Toolbar>
      <TemplatesBrowseDialog
        open={isTemplatesBrowseDialogOpen}
        onOpenChange={setIsTemplatesBrowseDialogOpen}
      />
    </>
  );
};
