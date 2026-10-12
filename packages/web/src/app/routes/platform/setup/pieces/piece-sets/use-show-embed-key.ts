import { signingKeyQueries } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

export function useShowEmbedKey(): boolean {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: signingKeys } = signingKeyQueries.useSigningKeys();
  return platform.plan.embeddingEnabled && (signingKeys?.data.length ?? 0) > 0;
}
