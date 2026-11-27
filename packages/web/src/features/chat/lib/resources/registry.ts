import { ApResourceKind } from '@activepieces/core-utils';
import { ResourceChangeOp } from '@activepieces/shared';
import { QueryKey } from '@tanstack/react-query';
import { generatePath } from 'react-router-dom';

import { flowsApi } from '@/features/flows/api/flows-api';
import { flowQueryKeys } from '@/features/flows/utils/flow-query-keys';
import { folderQueryKeys } from '@/features/folders/utils/folder-query-keys';
import { tablesApi } from '@/features/tables/api/tables-api';
import { tableQueryKeys } from '@/features/tables/utils/table-query-keys';
import { authenticationSession } from '@/lib/authentication-session';
import { routesThatRequireProjectId } from '@/lib/route-utils';

function fetchName({
  kind,
  id,
}: Pick<ResourceRef, 'kind' | 'id'>): Promise<string> {
  return KINDS[kind].fetchName(id);
}

function route(ref: ResourceRef): string {
  return `/projects/${ref.projectId}${KINDS[ref.kind].path(ref.id)}`;
}

function parentRoute(ref: ResourceRef): string {
  return `/projects/${ref.projectId}${routesThatRequireProjectId.automations}`;
}

function isOn({
  pathname,
  ref,
}: {
  pathname: string;
  ref: ResourceRef;
}): boolean {
  if (!pathname.includes(`/projects/${ref.projectId}/`)) return false;
  const marker = KINDS[ref.kind].path(ref.id);
  const at = pathname.indexOf(marker);
  if (at === -1) return false;
  const next = pathname.charAt(at + marker.length);
  return next === '' || next === '/';
}

function isInCurrentProject(ref: ResourceRef): boolean {
  return ref.projectId === authenticationSession.getProjectId();
}

function queryKeys({
  ref,
  op,
}: {
  ref: Pick<ResourceRef, 'kind' | 'id'>;
  op: ResourceChangeOp;
}): QueryKey[] {
  const kind = KINDS[ref.kind];
  return op === ResourceChangeOp.UPDATE
    ? [...kind.listKeys, ...kind.pageKeys(ref.id), folderQueryKeys.folders]
    : [...kind.listKeys, folderQueryKeys.folders];
}

function keyOf({ kind, id }: Pick<ResourceRef, 'kind' | 'id'>): string {
  return `${kind}:${id}`;
}

const KINDS: Record<ApResourceKind, KindSpec> = {
  [ApResourceKind.FLOW]: {
    path: (flowId) =>
      generatePath(routesThatRequireProjectId.singleFlow, { flowId }),
    listKeys: [...flowQueryKeys.lists, folderQueryKeys.contents],
    pageKeys: () => [],
    fetchName: (flowId) =>
      flowsApi.get(flowId).then((flow) => flow.version.displayName),
  },
  [ApResourceKind.TABLE]: {
    path: (tableId) =>
      generatePath(routesThatRequireProjectId.singleTable, { tableId }),
    listKeys: [...tableQueryKeys.lists, folderQueryKeys.contents],
    pageKeys: (tableId) => [
      tableQueryKeys.table(tableId),
      tableQueryKeys.fields(tableId),
    ],
    fetchName: (tableId) => tablesApi.getById(tableId).then((t) => t.name),
  },
};

export const resourceRegistry = {
  fetchName,
  route,
  parentRoute,
  isOn,
  isInCurrentProject,
  queryKeys,
  keyOf,
};

export type ResourceRef = {
  kind: ApResourceKind;
  id: string;
  projectId: string;
  name: string;
};

type KindSpec = {
  path: (id: string) => string;
  listKeys: QueryKey[];
  pageKeys: (id: string) => QueryKey[];
  fetchName: (id: string) => Promise<string>;
};
