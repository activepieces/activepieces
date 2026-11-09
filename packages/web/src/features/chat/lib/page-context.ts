import { AgentPageContext } from '@activepieces/shared';
import { useEffect } from 'react';
import { matchPath } from 'react-router-dom';

import { routeLocation } from '@/lib/route-location';

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
    { path: '/projects/:projectId/flows/:flowId', end: false },
    pathname,
  );
  if (flow?.params.projectId && flow.params.flowId) {
    const stepName =
      builder?.flowId === flow.params.flowId ? builder.stepName : null;
    return {
      kind: 'flow',
      id: flow.params.flowId,
      projectId: flow.params.projectId,
      ...(stepName ? { stepName } : {}),
    };
  }
  const table = matchPath(
    { path: '/projects/:projectId/tables/:tableId', end: false },
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

export const pageContextUtils = { current, fromPath };

const openBuilder: { read: ReadOpenBuilder | null } = { read: null };

type OpenBuilder = { flowId: string; stepName: string | null };

type ReadOpenBuilder = () => OpenBuilder;
