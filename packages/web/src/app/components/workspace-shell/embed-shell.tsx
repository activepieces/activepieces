import { Outlet, useLocation } from 'react-router-dom';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { cn } from '@/lib/utils';

// Full-bleed surfaces manage their own scrolling (canvas / grid); list pages need
// the container to scroll. Mirrors StageContainer's FULL_BLEED_TYPES, keyed off the
// embed URL since there is no Stage context to read the resource type from.
function isFullBleedPath(pathname: string): boolean {
  return /\/(flows|tables|runs)\/[^/]+/.test(pathname);
}

// Layout for the EMBEDDED app (iframe). Embedded surfaces render their own
// embed-gated chrome — the builder header (with its HomeButton), page headers —
// exactly as in production. This shell only provides the scroll container the pages
// expect (`#dashboard-content-container`).
//
// It deliberately renders NONE of the operator chrome: no Stage / StageHeaderBar,
// no chat panel, no global search (⌘K), no sidebar. That chrome lives only in
// WorkspaceShell, which the embed route tree never mounts (see app/guards). The rule
// for embed: OPT IN to a surface here — never re-introduce operator UI or scatter
// `isEmbedded` subtraction gates elsewhere to "support" embedding.
export function EmbedShell() {
  const { pathname } = useLocation();

  return (
    <SidebarProvider open={false} hoverMode={false}>
      <SidebarInset className="flex h-full flex-col overflow-hidden bg-background">
        <div
          id="dashboard-content-container"
          className={cn(
            'relative flex h-full min-h-0 flex-col bg-background',
            isFullBleedPath(pathname) ? 'overflow-hidden' : 'overflow-auto',
          )}
        >
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
