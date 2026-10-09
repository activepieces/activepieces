import { ActivepiecesError, ErrorCode, PlatformUsageMetric } from '@activepieces/core-utils';
import { getPlanLimits } from '@activepieces/shared';
import { FastifyBaseLogger } from 'fastify';
import { platformService } from '../../platform/platform.service';
import { synkraSubscriptionService } from '../billing/subscription.service';
import { synkraUsageService } from '../billing/usage.service';

/**
 * Synkra AI credit guard.
 *
 * Called BEFORE any AI operation. If the platform owner has exhausted
 * their monthly AI credits, we throw QUOTA_EXCEEDED so the caller aborts
 * cleanly. This gates:
 *   - Chat messages
 *   - Agent runs (from flows or chat)
 *   - AI piece steps (openai, claude, gemini, groq, deepseek, etc.)
 *
 * IMPORTANT: this is a pre-flight check. It runs BEFORE the AI call so
 * we never burn tokens we can't bill for.
 */
export const synkraAiGuard = (log: FastifyBaseLogger) => ({
  async assertAvailable(userId: string): Promise<void> {
    const sub = await synkraSubscriptionService(log).getOrCreateForUser(userId);
    const plan = getPlanLimits(sub.tier);
    const limit = plan.aiOps;

    // Free plan has 0 AI allowance — hard block.
    if (limit <= 0) {
      throw new ActivepiecesError({
        code: ErrorCode.QUOTA_EXCEEDED,
        params: {
          message:
            'AI is not included on your plan. Upgrade to Starter or higher to use AI features.',
          metric: PlatformUsageMetric.ACTIVE_FLOWS,
          usage: 0,
          limit: 0,
        },
      });
    }

    const usage = await synkraUsageService(log).getUsage(userId);
    if (usage.aiOpsUsed >= limit) {
      throw new ActivepiecesError({
        code: ErrorCode.QUOTA_EXCEEDED,
        params: {
          message: `You've used all ${limit} AI credits for this month. Buy more or upgrade your plan.`,
          metric: PlatformUsageMetric.ACTIVE_FLOWS,
          usage: usage.aiOpsUsed,
          limit,
        },
      });
    }
  },

  async assertAvailableForPlatform(platformId: string): Promise<void> {
    try {
      const platform = await platformService(log).getOne(platformId as never);
      if (!platform?.ownerId) {
        log.warn({ platformId }, 'synkra-ai-guard: no owner resolved — skipping check');
        return;
      }
      await this.assertAvailable(platform.ownerId);
    } catch (err) {
      // Re-throw QUOTA_EXCEEDED, swallow everything else (fail open).
      if (err instanceof ActivepiecesError && err.error.code === ErrorCode.QUOTA_EXCEEDED) {
        throw err;
      }
      log.warn({ err, platformId }, 'synkra-ai-guard: check failed — allowing AI call');
    }
  },
});
