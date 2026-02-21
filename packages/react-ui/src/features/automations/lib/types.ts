import {
  FolderDto,
  PopulatedFlow,
  SeekPage,
  Table,
} from '@activepieces/shared';

export type TreeItemType = 'folder' | 'flow' | 'table' | 'load-more-folder';

export type TreeItem = {
  id: string;
  type: TreeItemType;
  name: string;
  data: FolderDto | PopulatedFlow | Table | null;
  depth: number;
  parentId: string | null;
  childCount?: number;
  folderId?: string;
  loadMoreCount?: number;
};

export type AutomationsFilters = {
  searchTerm: string;
  typeFilter: string[];
  statusFilter: string[];
  connectionFilter: string[];
  ownerFilter: string[];
};

export type FolderContent = {
  flows: PopulatedFlow[];
  tables: Table[];
  flowsNextCursor: string | null;
  tablesNextCursor: string | null;
};

export type RootPage = {
  flows: SeekPage<PopulatedFlow>;
  tables: SeekPage<Table>;
};
