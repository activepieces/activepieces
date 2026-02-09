import {
  FolderDto,
  PopulatedFlow,
  Table as TableType,
} from '@activepieces/shared';

export type TreeItemType =
  | 'folder'
  | 'flow'
  | 'table'
  | 'load-more-folder'
  | 'load-more-root';

export type TreeItem = {
  id: string;
  type: TreeItemType;
  name: string;
  data: FolderDto | PopulatedFlow | (TableType & { rowCount?: number }) | null;
  depth: number;
  parentId: string | null;
  childCount?: number;
  folderId?: string;
  loadMoreCount?: number;
};

export type FilterState = {
  searchTerm: string;
  typeFilter: string;
  statusFilter: string;
  connectionFilter: string;
  ownerFilter: string;
};

export type SelectionState = {
  selectedItems: Set<string>;
  toggleItemSelection: (item: TreeItem) => void;
  toggleAllSelection: () => void;
  clearSelection: () => void;
  selectedItemsList: TreeItem[];
};
