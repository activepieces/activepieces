import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils';
import { FastifyBaseLogger } from 'fastify';
import { platformService } from '../../platform/platform.service';
import { synkraSubscriptionService } from '../billing/subscription.service';

/**
 * Synkra BYOK (Bring Your Own Key) guard.
 *
 * Per the Synkra pricing doc:
 *   - Free / Starter / Business: must use Synkra AI only. Cannot add own
 *     OpenAI/Claude/Gemini/DeepSeek keys.
 *   - Pro: may optionally bring their own key.
 *
 * Called whenever a user or platform tries to save an AI provider
 * credential that is NOT the Synkra-managed provider.
 */
export const synkraByokGuard = (log: FastifyBaseLogger) => ({
  async assertByokAllowed(params: {
    platformId: string;
    providerName: string;
  }): Promise<void> {
    // Synkra's own provider is always allowed (it's our key).
    if (params.providerName.toLowerCase().startsWith('synkra')) {
      return;
    }

    try {
      const platform = await platformService(log).getOne(params.platformId as never);
      if (!platform?.ownerId) return;

      const sub = await synkraSubscriptionService(log).getOrCreateForUser(
        platform.ownerId,
      );

      if (sub.tier === 'pro') return; // Pro can BYOK

      throw new ActivepiecesError({
        code: ErrorCode.AUTHORIZATION,
        params: {
          message:
            'Bringing your own AI key is a Pro feature. Upgrade to Pro, or use Synkra AI (included in your plan).',
        },
      });
    } catch (err) {
      // Re-throw our own AUTH error, fail open on everything else.
      if (err instanceof ActivepiecesError && err.error.code === ErrorCode.AUTHORIZATION) {
        throw err;
      }
      log.warn(
        { err, platformId: params.platformId, provider: params.providerName },
        'synkra-byok-guard: check failed — allowing provider save',
      );
    }
  },
});
