import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import {
  AppConnectionWithoutSensitiveData,
  FlowStatus,
  FolderDto,
} from '@activepieces/shared';
import { t } from 'i18next';
import { FolderIcon, Link2, Search, ToggleLeft, User, X } from 'lucide-react';

import { LogoPlate } from '@/components/custom/logo-plate';
import { Toolbar } from '@/components/custom/page';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOwnerOptions } from '@/features/automations/hooks/use-owner-options';

import { MultiSelectFilter } from './multi-select-filter';

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
  showFolderFilter,
  onClearAllFilters,
  hasActiveFilters,
}: AutomationsFiltersProps) => {
  const { embedState } = useEmbedding();
  const ownerOptions = useOwnerOptions();

  const statusOptions = [
    { value: FlowStatus.ENABLED, label: t('Enabled') },
    { value: FlowStatus.DISABLED, label: t('Disabled') },
  ];

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

  const typeValue =
    typeFilter.length === 1 ? (typeFilter[0] as TypeOption) : 'all';

  const change = (apply: () => void) => {
    apply();
    onFilterChange?.();
  };

  return (
    <Toolbar>
      <InputGroup className="min-w-56 flex-1">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          aria-label={t('Search')}
          placeholder={
            embedState.hideTables
              ? t('Search flows')
              : t('Search flows and tables')
          }
          value={searchTerm}
          onChange={(e) => change(() => onSearchChange(e.target.value))}
        />
        {searchTerm && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label={t('Clear')}
              onClick={() => change(() => onSearchChange(''))}
            >
              <X />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>

      <MultiSelectFilter
        label={t('Status')}
        icon={<ToggleLeft />}
        options={statusOptions}
        selectedValues={statusFilter}
        onChange={(values) => change(() => onStatusFilterChange(values))}
      />

      <MultiSelectFilter
        label={t('Connection')}
        icon={<Link2 />}
        options={connectionOptions}
        selectedValues={connectionFilter}
        onChange={(values) => change(() => onConnectionFilterChange(values))}
        searchable
      />

      {!embedState.isEmbedded && (
        <MultiSelectFilter
          label={t('Owner')}
          icon={<User />}
          options={ownerOptions}
          selectedValues={ownerFilter}
          onChange={(values) => change(() => onOwnerFilterChange(values))}
          searchable
        />
      )}

      {showFolderFilter && folderOptions.length > 0 && (
        <MultiSelectFilter
          label={t('Folder')}
          icon={<FolderIcon />}
          options={folderOptions}
          selectedValues={folderFilter}
          onChange={(values) => change(() => onFolderFilterChange(values))}
          searchable
        />
      )}

      {hasActiveFilters && (
        <Button variant="ghost" onClick={() => change(onClearAllFilters)}>
          <X />
          {t('Clear all')}
        </Button>
      )}

      {!embedState.hideTables && (
        <Tabs
          value={typeValue}
          onValueChange={(value) =>
            change(() =>
              onTypeFilterChange(value === 'all' ? [] : [value as TypeOption]),
            )
          }
        >
          <TabsList>
            <TabsTrigger value="all">{t('Everything')}</TabsTrigger>
            <TabsTrigger value="flow">{t('Flows')}</TabsTrigger>
            <TabsTrigger value="table">{t('Tables')}</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
    </Toolbar>
  );
};

type TypeOption = 'all' | 'flow' | 'table';

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
  showFolderFilter: boolean;
  onClearAllFilters: () => void;
  hasActiveFilters: boolean;
};
