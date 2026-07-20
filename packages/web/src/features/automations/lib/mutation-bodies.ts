import { isNil } from '@activepieces/core-utils';
import {
  FlowOperationType,
  FlowVersion,
  PopulatedFlow,
  Table,
  UncategorizedFolderId,
} from '@activepieces/shared';

import { flowsApi } from '@/features/flows/api/flows-api';
import { foldersApi } from '@/features/folders/api/folders-api';
import { tablesUtils } from '@/features/tables';
import { tablesApi } from '@/features/tables/api/tables-api';
import { tableHooks } from '@/features/tables/hooks/table-hooks';

import { TreeItemType } from './types';

function normalizeFolderId(
  folderId: string | null | undefined,
): string | undefined {
  return !folderId || folderId === UncategorizedFolderId ? undefined : folderId;
}

async function createFlow({
  projectId,
  displayName,
  folderId,
}: {
  projectId: string;
  displayName: string;
  folderId?: string;
}): Promise<PopulatedFlow> {
  return flowsApi.create({
    projectId,
    displayName,
    folderId: normalizeFolderId(folderId),
  });
}

async function createTable({
  projectId,
  name,
  folderId,
}: {
  projectId: string;
  name: string;
  folderId?: string;
}): Promise<Table> {
  return tableHooks.createTableWithDefaults({
    name,
    folderId: normalizeFolderId(folderId),
    projectId,
  });
}

async function renameItem({
  id,
  type,
  newName,
}: {
  id: string;
  type: TreeItemType;
  newName: string;
}): Promise<void> {
  switch (type) {
    case 'flow':
      await flowsApi.update(id, {
        type: FlowOperationType.CHANGE_NAME,
        request: { displayName: newName },
      });
      return;
    case 'table':
      await tablesApi.update(id, { name: newName });
      return;
    case 'folder':
      await foldersApi.renameFolder(id, { displayName: newName });
      return;
    default:
      return;
  }
}

async function deleteItem({
  id,
  type,
}: {
  id: string;
  type: TreeItemType;
}): Promise<void> {
  switch (type) {
    case 'flow':
      await flowsApi.delete(id);
      return;
    case 'table':
      await tablesApi.delete(id);
      return;
    case 'folder':
      await foldersApi.delete(id);
      return;
    default:
      return;
  }
}

async function moveItem({
  id,
  type,
  targetFolderId,
}: {
  id: string;
  type: TreeItemType;
  targetFolderId: string;
}): Promise<void> {
  const folderId =
    isNil(targetFolderId) || targetFolderId === UncategorizedFolderId
      ? null
      : targetFolderId;
  switch (type) {
    case 'flow':
      await flowsApi.update(id, {
        type: FlowOperationType.CHANGE_FOLDER,
        request: { folderId },
      });
      return;
    case 'table':
      await tablesApi.update(id, { folderId });
      return;
    default:
      return;
  }
}

async function duplicateFlow({
  version,
  folderId,
  projectId,
}: {
  version: FlowVersion;
  folderId: string | null | undefined;
  projectId: string;
}): Promise<PopulatedFlow> {
  const displayName = `${version.displayName} - Copy`;
  const created = await flowsApi.create({
    displayName,
    projectId,
    folderId: folderId ?? undefined,
  });
  return flowsApi.update(created.id, {
    type: FlowOperationType.IMPORT_FLOW,
    request: {
      displayName,
      trigger: version.trigger,
      schemaVersion: version.schemaVersion,
      notes: version.notes,
    },
  });
}

async function exportTable(table: Table): Promise<void> {
  const exported = await tablesApi.export(table.id);
  tablesUtils.exportTables([exported]);
}

export const automationMutationUtils = {
  createFlow,
  createTable,
  renameItem,
  deleteItem,
  moveItem,
  duplicateFlow,
  exportTable,
};
