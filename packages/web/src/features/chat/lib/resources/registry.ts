import { isObject, tryCatchSync } from '@activepieces/core-utils';
import { ApResource } from '@activepieces/shared';
import { QueryKey } from '@tanstack/react-query';
import { generatePath } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';
import { routesThatRequireProjectId } from '@/lib/route-utils';

function resolve(output: unknown): ResolvedCall | null {
  const parsed = parseOutput(output);
  if (!isObject(parsed) || !isObject(parsed._meta)) return null;
  const contract = ApResource.safeParse(parsed._meta.apResource);
  if (!contract.success) return null;
  const { kind, id, projectId, op, label } = contract.data;
  return { ref: { kind, id, projectId, name: label }, op };
}

function route(ref: ResourceRef): string {
  return inProject({ ref, path: KINDS[ref.kind].path(ref.id) });
}

function parentRoute(ref: ResourceRef): string {
  return inProject({ ref, path: KINDS[ref.kind].parentPath });
}

function inProject({ ref, path }: { ref: ResourceRef; path: string }): string {
  return ref.projectId
    ? `/projects/${ref.projectId}${path}`
    : authenticationSession.appendProjectRoutePrefix(path);
}

function isOn(pathname: string, ref: ResourceRef): boolean {
  if (ref.projectId && !pathname.includes(`/projects/${ref.projectId}/`)) {
    return false;
  }
  const marker = KINDS[ref.kind].path(ref.id);
  const at = pathname.indexOf(marker);
  if (at === -1) return false;
  const next = pathname.charAt(at + marker.length);
  return next === '' || next === '/';
}

function isInCurrentProject(ref: ResourceRef): boolean {
  return (
    !ref.projectId || ref.projectId === authenticationSession.getProjectId()
  );
}

function queryKeys(ref: ResourceRef): QueryKey[] {
  return KINDS[ref.kind].queryKeys(ref.id);
}

function keyOf({ kind, id }: Pick<ResourceRef, 'kind' | 'id'>): string {
  return `${kind}:${id}`;
}

function parseOutput(output: unknown): unknown {
  if (typeof output !== 'string') return output;
  return tryCatchSync<unknown>(() => JSON.parse(output)).data ?? null;
}

const AUTOMATIONS_LIST_KEYS: QueryKey[] = [
  ['root-flows'],
  ['root-tables'],
  ['all-folder-contents'],
  ['folders'],
];

const KINDS: Record<ResourceKind, KindSpec> = {
  flow: {
    path: (flowId) =>
      generatePath(routesThatRequireProjectId.singleFlow, { flowId }),
    parentPath: routesThatRequireProjectId.automations,
    queryKeys: () => [['flows'], ...AUTOMATIONS_LIST_KEYS],
  },
  table: {
    path: (tableId) =>
      generatePath(routesThatRequireProjectId.singleTable, { tableId }),
    parentPath: routesThatRequireProjectId.automations,
    queryKeys: () => [['tables'], ...AUTOMATIONS_LIST_KEYS],
  },
  agent: {
    path: (agentId) =>
      generatePath(routesThatRequireProjectId.singleAgent, { agentId }),
    parentPath: routesThatRequireProjectId.automations,
    queryKeys: () => [['agents'], ...AUTOMATIONS_LIST_KEYS],
  },
  run: {
    path: (runId) =>
      generatePath(routesThatRequireProjectId.singleRun, { runId }),
    parentPath: routesThatRequireProjectId.runs,
    queryKeys: (runId) => [
      ['run', runId],
      ['flow-run', runId],
      ['flow-run-table'],
      ['flow-run-count-by-status'],
    ],
  },
  connection: {
    path: () => routesThatRequireProjectId.connections,
    parentPath: routesThatRequireProjectId.connections,
    queryKeys: () => [['app-connections']],
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
  projectId?: string;
  name: string;
};

export type ResolvedCall = {
  ref: ResourceRef;
  op: ResourceOp;
};

type KindSpec = {
  path: (id: string) => string;
  parentPath: string;
  queryKeys: (id: string) => QueryKey[];
};
