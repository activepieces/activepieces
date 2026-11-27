import { useEmbedding } from '@/components/providers/embed-provider';
import { platformHooks } from '@/hooks/platform-hooks';
import { CHAT_ALLOWED, useShellHandle } from '@/lib/shell-handle';

export function useChatEnabled(): boolean {
  const embedded = useEmbedding().embedState.isEmbedded;
  const { platform } = platformHooks.useCurrentPlatform();
  return platform.plan.chatEnabled && !embedded;
}

export function useChatOn(): boolean {
  const embedded = useEmbedding().embedState.isEmbedded;
  const { platform } = platformHooks.useCurrentPlatform();
  const { shell, chat } = useShellHandle();
  return (
    platform.plan.chatEnabled &&
    CHAT_ALLOWED[shell] &&
    (!embedded || chat === 'full')
  );
}
