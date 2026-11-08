import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { create } from 'zustand';

import { CHAT_ROUTE } from '@/lib/route-utils';

import { ResourceKind, resourceRegistry } from './resources/registry';

const useSelectionStore = create<{ selection: PageSelection | null }>(() => ({
  selection: null,
}));

export function usePageContext(): PageContext | null {
  const { pathname } = useLocation();
  const selection = useSelectionStore((state) => state.selection);
  return useMemo(
    () => fromPath({ pathname, selection }),
    [pathname, selection],
  );
}

export function useReportPageSelection({
  stepName,
  recordIds,
}: {
  stepName?: string | null;
  recordIds?: readonly string[];
}): void {
  const ids = (recordIds ?? []).slice(0, MAX_RECORD_IDS);
  const idsKey = ids.join(',');
  useEffect(() => {
    const next: PageSelection = {
      ...(stepName ? { stepName } : {}),
      ...(idsKey ? { recordIds: idsKey.split(',') } : {}),
    };
    const selection = Object.keys(next).length > 0 ? next : null;
    useSelectionStore.setState({ selection });
    return () => {
      if (useSelectionStore.getState().selection === selection) {
        useSelectionStore.setState({ selection: null });
      }
    };
  }, [stepName, idsKey]);
}

function fromPath({
  pathname,
  selection,
}: {
  pathname: string;
  selection: PageSelection | null;
}): PageContext | null {
  if (pathname === CHAT_ROUTE || pathname.startsWith(`${CHAT_ROUTE}/`)) {
    return null;
  }
  const ref = resourceRegistry.refAt(pathname);
  const projectId =
    ref?.projectId ?? /^\/projects\/([^/]+)/.exec(pathname)?.[1];
  return {
    kind: ref?.kind ?? 'page',
    ...(ref ? { id: ref.id } : {}),
    ...(projectId ? { projectId } : {}),
    ...(ref && selection ? { selection } : {}),
  };
}

export const pageContextUtils = { fromPath };

const MAX_RECORD_IDS = 50;

export type PageSelection = { stepName?: string; recordIds?: string[] };

export type PageContext = {
  kind: ResourceKind | 'page';
  id?: string;
  projectId?: string;
  selection?: PageSelection;
};
