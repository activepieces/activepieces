import { isNil } from '@activepieces/core-utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { PanelImperativeHandle } from 'react-resizable-panels';
import { Navigate, useLocation } from 'react-router-dom';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { PurchaseExtraFlowsDialog } from '@/features/billing';
import { projectHooks } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

import { authenticationSession } from '../../../lib/authentication-session';
import { GlobalSearchProvider } from '../global-search/global-search-context';
import { ProjectDashboardSidebar } from '../sidebar/dashboard';

import { ChatDockProvider } from './chat-dock-context';
import { StageContainer } from './stage-container';
import { StageProvider, useStage } from './stage-context';
import { WorkspaceChatPanel } from './workspace-chat-panel';

const CHAT_PANEL_OPEN_SIZE = '30%';
const CHAT_PANEL_MIN_SIZE = '22%';
const STAGE_PANEL_OPEN_SIZE = '70%';
const STAGE_PANEL_MIN_SIZE = '22%';
const DOCK_HINT_DURATION_MS = 9000;
const DOCK_HINT_SEEN_KEY = 'apChatDockHintSeen_v2';
// Opening/closing the stage moves the chat between full-width and its narrow
// side panel. react-resizable-panels applies the size change to `flex-grow` in a
// single synchronous frame, so without this the chat would teleport. We ease
// flex-grow only around these programmatic changes — a drag shares the same
// flex-grow path and must stay instant, so the transition is stripped afterwards.
const PANEL_RESIZE_MS = 480;
const PANEL_RESIZE_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
// The 1px separator between the two panels; excluded when deriving each panel's
// resting pixel width from the group so the content lock matches the final layout.
const PANEL_HANDLE_PX = 1;
// Resting width fractions, mirroring CHAT/STAGE_PANEL_OPEN_SIZE. Used to lock each
// panel's content to its final layout during the resize (see animatePanelResize).
const CHAT_OPEN_FRACTION = 0.3;
const STAGE_OPEN_FRACTION = 0.7;

function hasSeenDockHint(): boolean {
  return localStorage.getItem(DOCK_HINT_SEEN_KEY) === 'true';
}

function markDockHintSeen(): void {
  localStorage.setItem(DOCK_HINT_SEEN_KEY, 'true');
}

export function WorkspaceShell() {
  const { pathname } = useLocation();
  // The shell is a pathless layout, so it has no :projectId param. On a project
  // route the project switch (TokenCheckerWrapper) runs in a child rendered below
  // us, so reading the session here would lag a render — derive the project from
  // the URL instead, falling back to the session on /chat (no project in the URL).
  const projectIdFromPath =
    pathname.match(/^\/projects\/([^/?#]+)/)?.[1] ?? null;
  const currentProjectId =
    projectIdFromPath ?? authenticationSession.getProjectId();
  if (isNil(currentProjectId) || currentProjectId === '') {
    return <Navigate to="/sign-in" replace />;
  }
  return (
    <StageProvider>
      <GlobalSearchProvider>
        <ProjectChangedRedirector currentProjectId={currentProjectId}>
          <WorkspaceShellInner />
        </ProjectChangedRedirector>
      </GlobalSearchProvider>
    </StageProvider>
  );
}

function ProjectChangedRedirector({
  currentProjectId,
  children,
}: {
  currentProjectId: string;
  children: React.ReactNode;
}) {
  projectHooks.useReloadPageIfProjectIdChanged(currentProjectId);
  return <>{children}</>;
}

function WorkspaceShellInner() {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { platform } = platformHooks.useCurrentPlatform();
  const chatEnabled = platform.plan.chatEnabled;
  const { isStageOpen, closeStage, stageKey } = useStage();
  const isMobile = useIsMobile();
  const chatPanelRef = useRef<PanelImperativeHandle>(null);
  const stagePanelRef = useRef<PanelImperativeHandle>(null);
  const chatPanelEl = useRef<HTMLDivElement | null>(null);
  const stagePanelEl = useRef<HTMLDivElement | null>(null);
  const groupEl = useRef<HTMLDivElement | null>(null);
  const panelAnimTimeout = useRef<number | null>(null);
  const lockedContentEls = useRef<HTMLElement[]>([]);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [chatPopped, setChatPopped] = useState(false);

  // Undo everything animatePanelResize applied: the eased transition on the panel
  // roots and the resting-width lock on their content. Idempotent, so it's safe to
  // call at the start of a new animation, at settle, and on unmount.
  const clearPanelAnim = useCallback(() => {
    [chatPanelEl.current, stagePanelEl.current].forEach((el) => {
      if (el) el.style.transition = '';
    });
    lockedContentEls.current.forEach((content) => {
      content.style.width = '';
      content.style.maxWidth = '';
    });
    lockedContentEls.current = [];
  }, []);

  // Ease the chat/stage width change of a programmatic resize while keeping the
  // CONTENT inside each panel visually stable ("reveal, don't reflow"): the frame
  // eases its flex-grow, but each panel's content is pinned to its final pixel
  // width so nothing inside rewraps or crosses a container-query breakpoint —
  // the panel's own overflow:hidden clips/reveals it. The transition and pin are
  // set imperatively on the live nodes (not via className/state) because the
  // library re-renders the new flex-grow synchronously — a state-driven change
  // could commit a frame too late and let the width snap. `targets` are the
  // resting width fractions each panel is settling to; a panel collapsing to 0 is
  // left unpinned so it clips away naturally. Cleared after settle so a manual
  // divider drag (which never comes through here) stays instant.
  const animatePanelResize = useCallback(
    (mutate: () => void, targets: { chat: number; stage: number }) => {
      const chatRoot = chatPanelEl.current;
      const stageRoot = stagePanelEl.current;
      const group = groupEl.current;
      const roots = [chatRoot, stageRoot].filter(
        (el): el is HTMLDivElement => el !== null,
      );
      if (roots.length === 0 || !group) {
        mutate();
        return;
      }
      // Cancel any in-flight animation and undo its leftovers before re-arming, so
      // a rapid open→close→open never strands a transition or a stale width lock.
      if (panelAnimTimeout.current !== null) {
        window.clearTimeout(panelAnimTimeout.current);
        panelAnimTimeout.current = null;
      }
      clearPanelAnim();

      const usableWidth = group.clientWidth - PANEL_HANDLE_PX;
      const pinContent = (root: HTMLDivElement | null, fraction: number) => {
        if (!root || fraction <= 0) return;
        const content = root.firstElementChild;
        if (!(content instanceof HTMLElement)) return;
        content.style.width = `${Math.round(usableWidth * fraction)}px`;
        // Override the library's maxWidth:100% so the pin holds at the resting
        // width even while the frame is momentarily narrower (and clips it).
        content.style.maxWidth = 'none';
        lockedContentEls.current.push(content);
      };
      pinContent(chatRoot, targets.chat);
      pinContent(stageRoot, targets.stage);

      const transition = `flex-grow ${PANEL_RESIZE_MS}ms ${PANEL_RESIZE_EASE}`;
      roots.forEach((el) => {
        el.style.transition = transition;
      });
      void roots[0].offsetWidth;
      mutate();
      panelAnimTimeout.current = window.setTimeout(() => {
        clearPanelAnim();
        panelAnimTimeout.current = null;
      }, PANEL_RESIZE_MS + 60);
    },
    [clearPanelAnim],
  );

  useEffect(
    () => () => {
      if (panelAnimTimeout.current !== null) {
        window.clearTimeout(panelAnimTimeout.current);
      }
      clearPanelAnim();
    },
    [clearPanelAnim],
  );

  // Direct link to a flow/table: the stage mounts already open. Pin the chat to
  // its narrow side-panel width — without this the panel library can settle on an
  // even split and leave the chat at half-screen. Mount-only: re-pinning on every
  // navigation would discard the user's manual resize.
  useEffect(() => {
    const stage = stagePanelRef.current;
    const chat = chatPanelRef.current;
    if (stage && chat && isStageOpen && !stage.isCollapsed()) {
      chat.resize(CHAT_PANEL_OPEN_SIZE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The Stage panel mirrors route state: open when a flow/table/page is showing,
  // collapsed (chat-only) otherwise. Both panels stay mounted across these
  // transitions so the chat stream is never torn down. Keyed on the resource
  // identity (not just the open/closed boolean) so opening a NEW resource
  // re-expands a stage that a drag-to-close left collapsed.
  useEffect(() => {
    const stage = stagePanelRef.current;
    const chat = chatPanelRef.current;
    if (!stage || !chat) {
      return;
    }
    if (isStageOpen) {
      if (stage.isCollapsed()) {
        animatePanelResize(() => stage.resize(STAGE_PANEL_OPEN_SIZE), {
          chat: CHAT_OPEN_FRACTION,
          stage: STAGE_OPEN_FRACTION,
        });
      }
    } else if (!stage.isCollapsed()) {
      animatePanelResize(
        () => {
          stage.collapse();
          chat.expand();
        },
        { chat: 1, stage: 0 },
      );
      setChatPopped(false);
    }
  }, [stageKey, isStageOpen, animatePanelResize]);

  const syncChatCollapsed = useCallback(() => {
    const panel = chatPanelRef.current;
    if (panel) {
      setChatCollapsed(panel.isCollapsed());
    }
  }, []);

  const closeChat = useCallback(() => {
    animatePanelResize(() => chatPanelRef.current?.collapse(), {
      chat: 0,
      stage: 1,
    });
  }, [animatePanelResize]);

  const showChat = useCallback(() => {
    animatePanelResize(() => chatPanelRef.current?.expand(), {
      chat: CHAT_OPEN_FRACTION,
      stage: STAGE_OPEN_FRACTION,
    });
  }, [animatePanelResize]);

  // First time we auto-pop the chat for the user, teach them how to get back by
  // flashing a one-time hint on the floating dock control (see popOutChat).
  const [dockHintVisible, setDockHintVisible] = useState(false);
  useEffect(() => {
    if (!dockHintVisible) return;
    const id = window.setTimeout(() => {
      setDockHintVisible(false);
      markDockHintSeen();
    }, DOCK_HINT_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [dockHintVisible]);

  // Pop-out floats the chat as a fixed card and hands the full width to the
  // stage by collapsing the chat panel. The chat component stays mounted in its
  // slot, so the stream is preserved.
  const popOutChat = useCallback(
    (options?: { teachDock?: boolean }) => {
      setChatPopped(true);
      animatePanelResize(() => chatPanelRef.current?.collapse(), {
        chat: 0,
        stage: 1,
      });
      if (options?.teachDock && !hasSeenDockHint()) {
        setDockHintVisible(true);
      }
    },
    [animatePanelResize],
  );

  const dismissDockHint = useCallback(() => {
    setDockHintVisible(false);
    markDockHintSeen();
  }, []);

  const dockChat = useCallback(() => {
    setChatPopped(false);
    animatePanelResize(() => chatPanelRef.current?.expand(), {
      chat: CHAT_OPEN_FRACTION,
      stage: STAGE_OPEN_FRACTION,
    });
    setDockHintVisible(false);
    markDockHintSeen();
  }, [animatePanelResize]);

  // The chat panel is already collapsed while floating, so closing just drops the
  // float and lands in the closed state (stage full-width, "Show chat" available).
  const closeFloatingChat = useCallback(() => {
    setChatPopped(false);
  }, []);

  // react-resizable-panels has no onCollapse. onLayoutChanged (unlike the Panel's
  // ResizeObserver-driven onResize) only fires after the pointer is released, so
  // closing here never navigates mid-drag — which would tear the now-disabled
  // handle out of an active drag and corrupt the panel layout state, breaking the
  // next reopen. The isStageOpen guard makes the programmatic collapse in the
  // effect above (button-close path) a no-op so it never double-navigates.
  const handleStageLayoutChanged = useCallback(() => {
    if (isStageOpen && stagePanelRef.current?.isCollapsed()) {
      closeStage();
    }
  }, [isStageOpen, closeStage]);

  const chatDockValue = useMemo(
    () => ({ chatPopped, chatCollapsed, popOutChat, dockChat }),
    [chatPopped, chatCollapsed, popOutChat, dockChat],
  );

  // Chat off (Community, EE without the flag, Cloud outside the rollout): the Stage
  // is the whole workspace — no chat panel, no resizable split, no close-to-chat
  // affordance. Everything else (sidebar, Stage content, project actions) stays.
  if (!chatEnabled) {
    return (
      <SidebarProvider defaultOpen={false} hoverMode={false}>
        <ProjectDashboardSidebar />
        <SidebarInset className="flex flex-col h-full overflow-hidden bg-sidebar">
          <div className="flex-1 flex overflow-hidden p-1.5">
            <StageContainer standalone />
          </div>
          {edition === ApEdition.CLOUD && <PurchaseExtraFlowsDialog />}
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <ChatDockProvider value={chatDockValue}>
      <SidebarProvider defaultOpen={false} hoverMode={false}>
        <ProjectDashboardSidebar />
        <SidebarInset className="flex flex-col h-full overflow-hidden bg-sidebar">
          <div className="flex-1 flex overflow-hidden p-1.5">
            <ResizablePanelGroup
              elementRef={groupEl}
              orientation="horizontal"
              onLayoutChanged={handleStageLayoutChanged}
              className="rounded-xl border bg-background overflow-hidden shadow-[2px_0px_4px_-2px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)]"
            >
              <ResizablePanel
                id="chat-panel"
                panelRef={chatPanelRef}
                elementRef={chatPanelEl}
                collapsible
                collapsedSize="0%"
                defaultSize={isStageOpen ? CHAT_PANEL_OPEN_SIZE : '100%'}
                minSize={CHAT_PANEL_MIN_SIZE}
                maxSize="100%"
                onResize={syncChatCollapsed}
                className="min-w-0"
              >
                <WorkspaceChatPanel
                  showClose={isStageOpen}
                  onClose={chatPopped ? closeFloatingChat : closeChat}
                  floating={chatPopped}
                  canPopOut={isStageOpen && !isMobile}
                  onPopOut={popOutChat}
                  onDock={dockChat}
                  showDockHint={chatPopped && dockHintVisible}
                  onDismissDockHint={dismissDockHint}
                />
              </ResizablePanel>
              <ResizableHandle
                disabled={!isStageOpen || chatCollapsed}
                className={cn(
                  'w-px bg-border/70 transition-[background-color,opacity] duration-300 after:w-2.5 hover:bg-primary/50 active:bg-primary',
                  (!isStageOpen || chatCollapsed) && 'opacity-0',
                )}
              />
              <ResizablePanel
                id="stage-panel"
                panelRef={stagePanelRef}
                elementRef={stagePanelEl}
                collapsible
                collapsedSize="0%"
                defaultSize={isStageOpen ? STAGE_PANEL_OPEN_SIZE : '0%'}
                minSize={STAGE_PANEL_MIN_SIZE}
                className="min-w-0"
              >
                <StageContainer
                  chromeless
                  chatCollapsed={chatCollapsed && !chatPopped}
                  onShowChat={showChat}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
          {edition === ApEdition.CLOUD && <PurchaseExtraFlowsDialog />}
        </SidebarInset>
      </SidebarProvider>
    </ChatDockProvider>
  );
}
