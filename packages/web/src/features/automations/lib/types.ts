import {
  AgentSummary,
  FolderDto,
  PopulatedFlow,
  Table,
} from '@activepieces/shared';

export type TreeItemType =
  | 'folder'
  | 'flow'
  | 'table'
  | 'agent'
  | 'load-more-folder';

export type SelectableItemType = 'folder' | 'flow' | 'table' | 'agent';

export type SelectedItemsMap = Map<string, SelectableItemType>;

export type TreeItem = {
  id: string;
  type: TreeItemType;
  name: string;
  data: FolderDto | PopulatedFlow | Table | AgentSummary | null;
  depth: number;
  folderId: string | null;
  childCount?: number;
  loadMoreCount?: number;
};

export type AutomationsFilters = {
  searchTerm: string;
  typeFilter: string[];
  statusFilter: string[];
  connectionFilter: string[];
  ownerFilter: string[];
  folderFilter: string[];
};

export type FolderContent = {
  flows: PopulatedFlow[];
  tables: Table[];
  agents: AgentSummary[];
};

export type AutomationsSort = 'default' | 'name-asc' | 'name-desc';
