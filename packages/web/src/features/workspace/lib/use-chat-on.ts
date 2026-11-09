import { useEmbedding } from '@/components/providers/embed-provider';
import { platformHooks } from '@/hooks/platform-hooks';

export function useChatOn(): boolean {
  const embedded = useEmbedding().embedState.isEmbedded;
  const { platform } = platformHooks.useCurrentPlatform();
  return platform.plan.chatEnabled && !embedded;
}
