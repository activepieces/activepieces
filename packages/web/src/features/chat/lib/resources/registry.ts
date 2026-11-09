import { isObject, tryCatchSync } from '@activepieces/core-utils';
import { ApResource } from '@activepieces/shared';
import { QueryKey } from '@tanstack/react-query';
import { generatePath } from 'react-router-dom';

import { flowQueryKeys } from '@/features/flows/utils/flow-query-keys';
import { folderQueryKeys } from '@/features/folders/utils/folder-query-keys';
import { tableQueryKeys } from '@/features/tables/utils/table-query-keys';
import { authenticationSession } from '@/lib/authentication-session';
import { routesThatRequireProjectId } from '@/lib/route-utils';

function resolve(output: unknown): { ref: ResourceRef; op: ResourceOp } | null {
  const parsed = parseOutput(output);
  if (!isObject(parsed) || !isObject(parsed._meta)) return null;
  const contract = ApResource.safeParse(parsed._meta.apResource);
  if (!contract.success) return null;
  const { kind, id, projectId, op, label } = contract.data;
  return { ref: { kind, id, projectId, name: label }, op };
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
  ref: ResourceRef;
  op: ResourceOp;
}): QueryKey[] {
  const kind = KINDS[ref.kind];
  return op === 'update'
    ? [...kind.listKeys, ...kind.pageKeys(ref.id), folderQueryKeys.folders]
    : [...kind.listKeys, folderQueryKeys.folders];
}

function keyOf({ kind, id }: Pick<ResourceRef, 'kind' | 'id'>): string {
  return `${kind}:${id}`;
}

function parseOutput(output: unknown): unknown {
  if (typeof output !== 'string') return output;
  return tryCatchSync<unknown>(() => JSON.parse(output)).data ?? null;
}

const KINDS: Record<ResourceKind, KindSpec> = {
  flow: {
    path: (flowId) =>
      generatePath(routesThatRequireProjectId.singleFlow, { flowId }),
    listKeys: [...flowQueryKeys.lists, folderQueryKeys.contents],
    pageKeys: () => [],
  },
  table: {
    path: (tableId) =>
      generatePath(routesThatRequireProjectId.singleTable, { tableId }),
    listKeys: [...tableQueryKeys.lists, folderQueryKeys.contents],
    pageKeys: (tableId) => [
      tableQueryKeys.table(tableId),
      tableQueryKeys.fields(tableId),
    ],
  },
};

export const resourceRegistry = {
  resolve,
  route,
  parentRoute,
  isOn,
  isInCurrentProject,
  queryKeys,
  keyOf,
};

export type ResourceKind = ApResource['kind'];

export type ResourceOp = ApResource['op'];

export type ResourceRef = {
  kind: ResourceKind;
  id: string;
  projectId: string;
  name: string;
};

type KindSpec = {
  path: (id: string) => string;
  listKeys: QueryKey[];
  pageKeys: (id: string) => QueryKey[];
};
