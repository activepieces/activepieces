import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

// Lets routed Stage content (e.g. the flow builder) render its own title into
// the Stage panel's header bar — "lifting" a resource title to the top level
// while keeping it wired to that resource's own React context. The content
// portals into `slot`; the Stage header renders an empty anchor div that sets
// it. Kept separate from StageContext so publishing a title never re-runs the
// heavier Stage consumers.
export function StageHeaderSlotProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [actionsSlot, setActionsSlot] = useState<HTMLElement | null>(null);
  const [titleCount, setTitleCount] = useState(0);
  const [resourceTitles, setResourceTitles] = useState<Record<string, string>>(
    {},
  );
  const registerTitle = useCallback(() => setTitleCount((c) => c + 1), []);
  const unregisterTitle = useCallback(() => setTitleCount((c) => c - 1), []);
  // Remembers each visited resource's human title keyed by `${type}:${id}`, so the
  // Stage breadcrumb can name a detail resource (e.g. "Lead scoring") before — or in
  // place of — the page's own injected title.
  const reportResourceTitle = useCallback((key: string, title: string) => {
    setResourceTitles((prev) =>
      prev[key] === title ? prev : { ...prev, [key]: title },
    );
  }, []);
  const value = useMemo<StageHeaderSlotValue>(
    () => ({
      slot,
      setSlot,
      actionsSlot,
      setActionsSlot,
      titleCount,
      registerTitle,
      unregisterTitle,
      resourceTitles,
      reportResourceTitle,
    }),
    [
      slot,
      actionsSlot,
      titleCount,
      registerTitle,
      unregisterTitle,
      resourceTitles,
      reportResourceTitle,
    ],
  );
  return (
    <StageHeaderSlotContext.Provider value={value}>
      {children}
    </StageHeaderSlotContext.Provider>
  );
}

export function useStageHeaderSlot(): StageHeaderSlotValue | null {
  return useContext(StageHeaderSlotContext);
}

// Publishes `content` into the Stage header bar via a DOM portal (keeping it wired
// to the calling page's React context) and registers its presence so the Stage
// container can hide its default label exactly while a page-specific title is shown.
export function useStageHeaderTitle(content: React.ReactNode): React.ReactNode {
  const ctx = useContext(StageHeaderSlotContext);
  const slot = ctx?.slot ?? null;
  const registerTitle = ctx?.registerTitle;
  const unregisterTitle = ctx?.unregisterTitle;
  const active = slot != null && content != null;
  useEffect(() => {
    if (!active || !registerTitle || !unregisterTitle) {
      return;
    }
    registerTitle();
    return unregisterTitle;
  }, [active, registerTitle, unregisterTitle]);
  return active ? createPortal(content, slot) : null;
}

// Publishes `content` into the Stage header bar's right-side actions area via a DOM
// portal (keeping it wired to the calling page's React context). Mirrors
// useStageHeaderTitle but targets the actions slot and needs no presence count.
export function useStageHeaderActions(
  content: React.ReactNode,
): React.ReactNode {
  const actionsSlot = useContext(StageHeaderSlotContext)?.actionsSlot ?? null;
  const active = actionsSlot != null && content != null;
  return active ? createPortal(content, actionsSlot) : null;
}

// Reports the currently-open resource's human title into the registry so the Stage
// breadcrumb can label it. No-op outside a provider, or until both the key and title
// are known.
export function useReportStageResourceTitle(
  key: string | null,
  title: string | null | undefined,
): void {
  const reportResourceTitle = useContext(
    StageHeaderSlotContext,
  )?.reportResourceTitle;
  useEffect(() => {
    if (!reportResourceTitle || !key || !title) {
      return;
    }
    reportResourceTitle(key, title);
  }, [reportResourceTitle, key, title]);
}

// The empty anchor the Stage header renders; routed content portals its title
// here. A useCallback ref publishes the element exactly once per mount/unmount
// (an inline ref callback would thrash setState every render).
export function StageHeaderAnchor({ className }: { className?: string }) {
  const setSlot = useStageHeaderSlot()?.setSlot;
  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      setSlot?.(el);
    },
    [setSlot],
  );
  return <div ref={ref} className={className} />;
}

// The empty anchor for the Stage header's right-side actions; routed content
// portals its controls (e.g. the builder's Runs / publish toolbar) here.
export function StageHeaderActionsAnchor({
  className,
}: {
  className?: string;
}) {
  const setActionsSlot = useStageHeaderSlot()?.setActionsSlot;
  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      setActionsSlot?.(el);
    },
    [setActionsSlot],
  );
  return <div ref={ref} className={className} />;
}

const StageHeaderSlotContext = createContext<StageHeaderSlotValue | null>(null);

export function stageResourceKey(type: string, id?: string): string {
  return id ? `${type}:${id}` : type;
}

export type StageHeaderSlotValue = {
  slot: HTMLElement | null;
  setSlot: (el: HTMLElement | null) => void;
  actionsSlot: HTMLElement | null;
  setActionsSlot: (el: HTMLElement | null) => void;
  titleCount: number;
  registerTitle: () => void;
  unregisterTitle: () => void;
  resourceTitles: Record<string, string>;
  reportResourceTitle: (key: string, title: string) => void;
};
