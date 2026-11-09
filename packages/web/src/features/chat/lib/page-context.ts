import { AgentPageContext } from '@activepieces/shared';
import { useEffect } from 'react';
import { matchPath } from 'react-router-dom';

import { routeLocation } from '@/lib/route-location';
import { routesThatRequireProjectId } from '@/lib/route-utils';

export function useOpenBuilder(read: ReadOpenBuilder): void {
  useEffect(() => {
    openBuilder.read = read;
    return () => {
      if (openBuilder.read === read) {
        openBuilder.read = null;
      }
    };
  }, [read]);
}

function current(): AgentPageContext | null {
  return fromPath({
    pathname: routeLocation.pathname(),
    builder: openBuilder.read?.() ?? null,
  });
}

function fromPath({
  pathname,
  builder,
}: {
  pathname: string;
  builder: OpenBuilder | null;
}): AgentPageContext | null {
  const flow = matchPath(
    { path: inProject(routesThatRequireProjectId.singleFlow), end: false },
    pathname,
  );
  if (flow?.params.projectId && flow.params.flowId) {
    const openFlow = builder?.flowId === flow.params.flowId ? builder : null;
    return {
      kind: 'flow',
      id: flow.params.flowId,
      projectId: flow.params.projectId,
      ...(openFlow?.label ? { label: openFlow.label } : {}),
      ...(openFlow?.stepName ? { stepName: openFlow.stepName } : {}),
    };
  }
  const table = matchPath(
    { path: inProject(routesThatRequireProjectId.singleTable), end: false },
    pathname,
  );
  if (table?.params.projectId && table.params.tableId) {
    return {
      kind: 'table',
      id: table.params.tableId,
      projectId: table.params.projectId,
    };
  }
  return null;
}

function inProject(route: string): string {
  return `/projects/:projectId${route}`;
}

export const pageContextUtils = { current, fromPath };

const openBuilder: { read: ReadOpenBuilder | null } = { read: null };

type OpenBuilder = {
  flowId: string;
  label: string | null;
  stepName: string | null;
};

type ReadOpenBuilder = () => OpenBuilder;
