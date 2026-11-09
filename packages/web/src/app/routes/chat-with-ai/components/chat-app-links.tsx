import { AppLinkProvider } from '@/components/prompt-kit/app-link';
import { chatPanelUtils } from '@/features/workspace/lib/chat-panel-open';

export function ChatAppLinks({ children }: { children: React.ReactNode }) {
  return <AppLinkProvider value={HANDLERS}>{children}</AppLinkProvider>;
}

const HANDLERS = {
  open: ({ route, name }: { route: string; name: string }) =>
    chatPanelUtils.openBeside({ route, push: true, name }),
};
