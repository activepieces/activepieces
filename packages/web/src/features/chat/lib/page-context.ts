import { AgentPageContext } from '@activepieces/shared';
import { useEffect } from 'react';
import { matchPath } from 'react-router-dom';
import { create } from 'zustand';

import { routeLocation } from '@/lib/route-location';
import { routesThatRequireProjectId } from '@/lib/route-utils';

export function useOpenBuilder(store: OpenBuilderStore): void {
  useEffect(() => {
    useOpenBuilderStore.setState({ store });
    return () => {
      if (useOpenBuilderStore.getState().store === store) {
        useOpenBuilderStore.setState({ store: null });
      }
    };
  }, [store]);
}

function current(): AgentPageContext | null {
  const { store } = useOpenBuilderStore.getState();
  return fromPath({
    pathname: routeLocation.pathname(),
    builder: store ? selectOpenBuilder(store.getState()) : null,
  });
}

function selectOpenBuilder(state: OpenBuilderState): OpenBuilder {
  return {
    flowId: state.flow.id,
    label: state.flowVersion.displayName,
    stepName: state.selectedStep,
  };
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
      ...(openFlow?.label
        ? { label: openFlow.label.slice(0, MAX_LABEL_LENGTH) }
        : {}),
      ...(openFlow?.stepName
        ? { stepName: openFlow.stepName.slice(0, MAX_STEP_NAME_LENGTH) }
        : {}),
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

const MAX_LABEL_LENGTH = 200;
const MAX_STEP_NAME_LENGTH = 128;

export const pageContextUtils = { current, fromPath };

const useOpenBuilderStore = create<{ store: OpenBuilderStore | null }>(() => ({
  store: null,
}));

type OpenBuilder = {
  flowId: string;
  label: string | null;
  stepName: string | null;
};

type OpenBuilderState = {
  flow: { id: string };
  flowVersion: { displayName: string };
  selectedStep: string | null;
};

type OpenBuilderStore = { getState: () => OpenBuilderState };
