import { BrowserViewEvent } from '@activepieces/shared';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useElementSize } from '@/hooks/use-element-size';
import { authenticationSession } from '@/lib/authentication-session';
import { CHAT_ROUTE } from '@/lib/route-utils';

const STAGE_COMPACT_BREAKPOINT_PX = 760;

// Graded width tiers for the Stage, independent of STAGE_COMPACT_BREAKPOINT_PX:
// `isCompact` (760) still gates the wide split layout, while `stageTier` drives
// canvas density (branch spacing, fit-to-view floor) and the narrow editing
// experience. Kept orthogonal so changing one concern never shifts the other.
const STAGE_TIER_COMFORTABLE_MIN_PX = 900;
const STAGE_TIER_COMPACT_MIN_PX = 620;
const STAGE_TIER_NARROW_MIN_PX = 420;

function computeStageTier(width: number): StageTier {
  if (width <= 0 || width >= STAGE_TIER_COMFORTABLE_MIN_PX) {
    return 'comfortable';
  }
  if (width >= STAGE_TIER_COMPACT_MIN_PX) {
    return 'compact';
  }
  if (width >= STAGE_TIER_NARROW_MIN_PX) {
    return 'narrow';
  }
  return 'mini';
}

// The Stage is closed on the chat landing: /chat (canonical, project-agnostic) and
// the legacy bare /projects/:projectId (which redirects to /chat). Single-sourced so
// the Stage state and the sidebar's project highlight agree on when it's closed.
export function isChatLandingPath(pathname: string): boolean {
  return pathname === CHAT_ROUTE || /^\/projects\/[^/]+\/?$/.test(pathname);
}

function resourcePath(resource: StageResource): string {
  switch (resource.type) {
    case 'flow':
      return authenticationSession.appendProjectRoutePrefix(
        `/flows/${resource.id}`,
      );
    case 'table':
      return authenticationSession.appendProjectRoutePrefix(
        `/tables/${resource.id}`,
      );
    case 'run':
      return authenticationSession.appendProjectRoutePrefix(
        `/runs/${resource.id}`,
      );
    case 'runs':
      return authenticationSession.appendProjectRoutePrefix('/runs');
    case 'connections':
      return authenticationSession.appendProjectRoutePrefix('/connections');
    case 'variables':
      return authenticationSession.appendProjectRoutePrefix('/variables');
    case 'releases':
      return authenticationSession.appendProjectRoutePrefix('/releases');
    case 'release':
      return authenticationSession.appendProjectRoutePrefix(
        `/releases/${resource.id}`,
      );
    case 'settings':
      return authenticationSession.appendProjectRoutePrefix('/settings');
    case 'none':
      return CHAT_ROUTE;
    case 'automations':
    default:
      return authenticationSession.appendProjectRoutePrefix('/automations');
  }
}

function resourceKey(resource: StageResource): string {
  return 'id' in resource ? `${resource.type}:${resource.id}` : resource.type;
}

export function StageProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { search, pathname } = useLocation();
  const stageRef = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(stageRef);
  const [stack, setStack] = useState<StageResource[]>([]);
  const [stageFocus, setStageFocus] = useState<StageFocus | null>(null);
  const [stageExcerpt, setStageExcerpt] = useState<StageExcerpt | null>(null);
  const [browserView, setBrowserView] = useState<BrowserViewData | null>(null);

  const activeProjectId = useMemo<string | null>(() => {
    const match = pathname.match(/^\/projects\/([^/?#]+)/);
    return match ? match[1] : authenticationSession.getProjectId();
  }, [pathname]);

  const current = useMemo<StageResource>(() => {
    // Bare /projects/:projectId (no sub-route) is the chat-only landing — Stage closed.
    if (isChatLandingPath(pathname)) {
      return { type: 'none' };
    }
    const flowMatch = pathname.match(/\/flows\/([^/?#]+)/);
    if (flowMatch) {
      return { type: 'flow', id: flowMatch[1] };
    }
    const tableMatch = pathname.match(/\/tables\/([^/?#]+)/);
    if (tableMatch) {
      return { type: 'table', id: tableMatch[1] };
    }
    const runMatch = pathname.match(/\/runs\/([^/?#]+)/);
    if (runMatch) {
      return { type: 'run', id: runMatch[1] };
    }
    const releaseMatch = pathname.match(/\/releases\/([^/?#]+)/);
    if (releaseMatch) {
      return { type: 'release', id: releaseMatch[1] };
    }
    if (pathname.includes('/connections')) {
      return { type: 'connections' };
    }
    if (pathname.includes('/variables')) {
      return { type: 'variables' };
    }
    if (pathname.includes('/releases')) {
      return { type: 'releases' };
    }
    if (pathname.includes('/runs')) {
      return { type: 'runs' };
    }
    if (pathname.includes('/settings')) {
      return { type: 'settings' };
    }
    if (pathname.includes('/automations')) {
      return { type: 'automations' };
    }
    return { type: 'none' };
  }, [pathname]);

  useEffect(() => {
    setStack((prev) => {
      if (current.type === 'none') {
        return [];
      }
      const key = resourceKey(current);
      const top = prev[prev.length - 1];
      if (top && resourceKey(top) === key) {
        return prev;
      }
      const below = prev[prev.length - 2];
      if (below && resourceKey(below) === key) {
        return prev.slice(0, -1);
      }
      return [...prev, current];
    });
  }, [current]);

  const open = useCallback(
    (resource: StageResource) => {
      const chat = new URLSearchParams(search).get('chat');
      const path = resourcePath(resource);
      const target = chat ? `${path}?chat=${chat}` : path;
      navigate(target);
    },
    [navigate, search],
  );

  const back = useCallback(() => {
    const target = stack[stack.length - 2];
    if (!target) {
      return;
    }
    const chat = new URLSearchParams(search).get('chat');
    const path = resourcePath(target);
    navigate(chat ? `${path}?chat=${chat}` : path);
  }, [navigate, search, stack]);

  const closeStage = useCallback(() => {
    setBrowserView(null);
    const chat = new URLSearchParams(search).get('chat');
    navigate(chat ? `${CHAT_ROUTE}?chat=${chat}` : CHAT_ROUTE);
  }, [navigate, search]);

  // The fine-grained selection inside the open Stage resource (selected step,
  // selected table cell, …) is reported up from the Stage content via
  // reportStageFocus, then read by the chat's useStageContext. Stored as plain
  // state here because StageProvider wraps both the Stage outlet (the writer)
  // and the chat panel (the reader). Cleared whenever the Stage closes so a
  // stale focus from a previous resource never lingers.
  const reportStageFocus = useCallback((focus: StageFocus | null) => {
    setStageFocus(focus);
  }, []);

  // A compact snapshot of what the open Stage page is rendering (e.g. the visible
  // connection rows + their counts), reported up the same way so the chat can
  // interpret terse on-screen references ("17 0 0") without guessing.
  const reportStageExcerpt = useCallback((excerpt: StageExcerpt | null) => {
    setStageExcerpt(excerpt);
  }, []);

  // Shows a live browser view overlaid on the Stage content. When a new status
  // ('live' / 'idle' / 'closed') arrives for the same session, we update in-place
  // rather than replacing so the iframe does not flicker.
  const showBrowserView = useCallback((event: BrowserViewEvent) => {
    setBrowserView((prev) => {
      if (prev?.sessionId === event.sessionId) {
        return { ...prev, ...event };
      }
      return event;
    });
  }, []);

  const dismissBrowserView = useCallback(() => {
    setBrowserView(null);
  }, []);

  // Pause a live browser view the instant the chat turn stops. The worker now PARKS the Firecrawl
  // session at turn end (keeps it alive, resumable next message) rather than closing it, so we
  // swap the live iframe for a paused state immediately — both because the iframe shows nothing
  // useful once the agent stops driving, and to avoid an Unauthorized flash if the session is
  // closed. The worker's awaited trailing event then settles the final state ('idle' or 'closed').
  const pauseBrowserViewIfLive = useCallback(() => {
    setBrowserView((prev) =>
      prev && prev.status === 'live' ? { ...prev, status: 'idle' } : prev,
    );
  }, []);

  useEffect(() => {
    if (current.type === 'none') {
      setStageFocus(null);
      setStageExcerpt(null);
    }
  }, [current.type]);

  const isStageOpen = current.type !== 'none' || browserView !== null;
  const stageKey = isStageOpen
    ? browserView && current.type === 'none'
      ? `browser:${browserView.sessionId}`
      : resourceKey(current)
    : 'none';
  const isCompact = width > 0 && width < STAGE_COMPACT_BREAKPOINT_PX;
  const stageTier = computeStageTier(width);

  const value = useMemo<StageContextValue>(
    () => ({
      current,
      stageKey,
      activeProjectId,
      open,
      back,
      canGoBack: stack.length > 1,
      previous: stack.length > 1 ? stack[stack.length - 2] : null,
      closeStage,
      isStageOpen,
      stageRef,
      width,
      isCompact,
      stageTier,
      stageFocus,
      reportStageFocus,
      stageExcerpt,
      reportStageExcerpt,
      browserView,
      showBrowserView,
      dismissBrowserView,
      pauseBrowserViewIfLive,
    }),
    [
      current,
      stageKey,
      activeProjectId,
      open,
      back,
      stack,
      closeStage,
      isStageOpen,
      width,
      isCompact,
      stageTier,
      stageFocus,
      reportStageFocus,
      stageExcerpt,
      reportStageExcerpt,
      browserView,
      showBrowserView,
      dismissBrowserView,
      pauseBrowserViewIfLive,
    ],
  );

  return (
    <StageContext.Provider value={value}>{children}</StageContext.Provider>
  );
}

export function useStage(): StageContextValue {
  const ctx = useContext(StageContext);
  if (!ctx) {
    throw new Error('useStage must be used within a StageProvider');
  }
  return ctx;
}

export function useStageOptional(): StageContextValue | null {
  return useContext(StageContext);
}

const StageContext = createContext<StageContextValue | null>(null);

export type StageResource =
  | { type: 'flow'; id: string }
  | { type: 'table'; id: string }
  | { type: 'run'; id: string }
  | { type: 'release'; id: string }
  | { type: 'automations' }
  | { type: 'runs' }
  | { type: 'connections' }
  | { type: 'variables' }
  | { type: 'releases' }
  | { type: 'settings' }
  | { type: 'none' };

export type StageFocus = {
  scopeType: StageResource['type'];
  scopeId?: string;
  kind: string;
  label: string;
  ref?: string;
  detail?: string;
};

export type StageExcerpt = {
  scopeType: StageResource['type'];
  scopeId?: string;
  text: string;
};

export type StageContextValue = {
  current: StageResource;
  stageKey: string;
  activeProjectId: string | null;
  open: (resource: StageResource) => void;
  back: () => void;
  canGoBack: boolean;
  previous: StageResource | null;
  closeStage: () => void;
  isStageOpen: boolean;
  stageRef: React.RefObject<HTMLDivElement | null>;
  width: number;
  isCompact: boolean;
  stageTier: StageTier;
  stageFocus: StageFocus | null;
  reportStageFocus: (focus: StageFocus | null) => void;
  stageExcerpt: StageExcerpt | null;
  reportStageExcerpt: (excerpt: StageExcerpt | null) => void;
  browserView: BrowserViewData | null;
  showBrowserView: (event: BrowserViewEvent) => void;
  dismissBrowserView: () => void;
  pauseBrowserViewIfLive: () => void;
};

export type BrowserViewData = BrowserViewEvent;

export type StageTier = 'comfortable' | 'compact' | 'narrow' | 'mini';
