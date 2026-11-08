import { AppLinkProvider } from '@/components/prompt-kit/app-link';
import { resourceRegistry } from '@/features/chat/lib/resources/registry';
import { openInAppUtils } from '@/features/workspace/lib/use-open-in-app';

export function ChatAppLinks({ children }: { children: React.ReactNode }) {
  return <AppLinkProvider value={HANDLERS}>{children}</AppLinkProvider>;
}

function label(route: string): string {
  const pathname = route.split(/[?#]/)[0];
  const ref = resourceRegistry.refAt(pathname);
  return ref ? resourceRegistry.kindInfo(ref.kind).label : pathname;
}

const HANDLERS = { open: openInAppUtils.openBeside, label };
