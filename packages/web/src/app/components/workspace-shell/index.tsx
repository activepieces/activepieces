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
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

import { authenticationSession } from '../../../lib/authentication-session';
import { GlobalSearchProvider } from '../global-search/global-search-context';
import { ProjectDashboardSidebar } from '../sidebar/dashboard';

import { ChatDockProvider } from './chat-dock-context';
import { StageContainer } from './stage-container';
import { StageProvider, useStage } from './stage-context';
import { WorkspaceChatPanel } from './workspace-chat-panel';

const CHAT_PANEL_OPEN_SIZE = '38%';
const CHAT_PANEL_MIN_SIZE = '22%';
const STAGE_PANEL_OPEN_SIZE = '62%';
const STAGE_PANEL_MIN_SIZE = '22%';
const DOCK_HINT_DURATION_MS = 9000;
const DOCK_HINT_SEEN_KEY = 'apChatDockHintSeen_v2';

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
  const { isStageOpen, closeStage, stageKey } = useStage();
  const isMobile = useIsMobile();
  const chatPanelRef = useRef<PanelImperativeHandle>(null);
  const stagePanelRef = useRef<PanelImperativeHandle>(null);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [chatPopped, setChatPopped] = useState(false);
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
        stage.resize(STAGE_PANEL_OPEN_SIZE);
      }
    } else if (!stage.isCollapsed()) {
      stage.collapse();
      setChatPopped(false);
      chat.expand();
    }
  }, [stageKey, isStageOpen]);

  const syncChatCollapsed = useCallback(() => {
    const panel = chatPanelRef.current;
    if (panel) {
      setChatCollapsed(panel.isCollapsed());
    }
  }, []);

  const closeChat = useCallback(() => {
    chatPanelRef.current?.collapse();
  }, []);

  const showChat = useCallback(() => {
    chatPanelRef.current?.expand();
  }, []);

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
  const popOutChat = useCallback((options?: { teachDock?: boolean }) => {
    setChatPopped(true);
    chatPanelRef.current?.collapse();
    if (options?.teachDock && !hasSeenDockHint()) {
      setDockHintVisible(true);
    }
  }, []);

  const dismissDockHint = useCallback(() => {
    setDockHintVisible(false);
    markDockHintSeen();
  }, []);

  const dockChat = useCallback(() => {
    setChatPopped(false);
    chatPanelRef.current?.expand();
    setDockHintVisible(false);
    markDockHintSeen();
  }, []);

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

  return (
    <ChatDockProvider value={chatDockValue}>
      <SidebarProvider open={false} hoverMode={false}>
        <ProjectDashboardSidebar />
        <SidebarInset className="flex flex-col h-full overflow-hidden bg-sidebar">
          <div className="flex-1 flex overflow-hidden p-1.5">
            <ResizablePanelGroup
              orientation="horizontal"
              onLayoutChanged={handleStageLayoutChanged}
              className="rounded-xl border bg-background overflow-hidden shadow-[2px_0px_4px_-2px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)]"
            >
              <ResizablePanel
                id="chat-panel"
                panelRef={chatPanelRef}
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
                  'w-px bg-border/70 transition-colors after:w-2.5 hover:bg-primary/50 active:bg-primary',
                  (!isStageOpen || chatCollapsed) && 'opacity-0',
                )}
              />
              <ResizablePanel
                id="stage-panel"
                panelRef={stagePanelRef}
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
