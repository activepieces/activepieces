import { ProjectMemberWithUser } from '@activepieces/ee-shared';
import { PopulatedFlow } from '@activepieces/shared';

import { TreeItem } from './types';

export const getItemKey = (item: TreeItem): string => {
  return `${item.type}-${item.id}`;
};

export const FOLDER_PAGE_SIZE = 10;
export const ROOT_PAGE_SIZE = 5;
export const FILTER_ALL = 'all';
export type FILTER_TYPES = typeof FILTER_ALL | 'flow' | 'table';

export const getFlowOwner = (
  flow: PopulatedFlow,
  projectMembers: ProjectMemberWithUser[] | undefined,
): ProjectMemberWithUser | undefined => {
  if (!flow.ownerId || !projectMembers) return undefined;
  return projectMembers.find((m) => m.userId === flow.ownerId);
};

export const getPaginationInfo = (
  currentPage: number,
  pageSize: number,
  totalItems: number,
) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = currentPage * pageSize + 1;
  const end = Math.min((currentPage + 1) * pageSize, totalItems);

  return {
    totalPages,
    start,
    end,
    hasPreviousPage: currentPage > 0,
    hasNextPage: currentPage < totalPages - 1,
  };
};

export const getSelectedItemsByType = (selectedItems: TreeItem[]) => {
  const flowIds = selectedItems
    .filter((item) => item.type === 'flow')
    .map((item) => item.id);
  const tableIds = selectedItems
    .filter((item) => item.type === 'table')
    .map((item) => item.id);
  const folderIds = selectedItems
    .filter((item) => item.type === 'folder')
    .map((item) => item.id);

  return { flowIds, tableIds, folderIds };
};
