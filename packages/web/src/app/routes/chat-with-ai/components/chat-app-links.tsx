import { AppLinkProvider } from '@/components/prompt-kit/app-link';
import { followAlong } from '@/features/chat/lib/follow/follow-along';
import { resourceRegistry } from '@/features/chat/lib/resources/registry';
import { chatTransitions } from '@/features/workspace/lib/chat-panel-open';

export function ChatAppLinks({ children }: { children: React.ReactNode }) {
  return <AppLinkProvider value={HANDLERS}>{children}</AppLinkProvider>;
}

function open(route: string): void {
  const ref = resourceRegistry.refAt(route);
  if (
    ref &&
    resourceRegistry.route(ref) === route &&
    resourceRegistry.isInCurrentProject(ref)
  ) {
    followAlong.view(ref);
    return;
  }
  chatTransitions.openBeside({ route, push: true });
}

function label(route: string): string {
  const pathname = route.split(/[?#]/)[0];
  const ref = resourceRegistry.refAt(pathname);
  return ref ? resourceRegistry.kindInfo(ref.kind).label : pathname;
}

const HANDLERS = { open, label };
