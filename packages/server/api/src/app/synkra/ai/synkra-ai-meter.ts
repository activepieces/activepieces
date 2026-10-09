import { ActivepiecesAiConsumerSource } from '@activepieces/core-utils';
import { FastifyBaseLogger } from 'fastify';
import { system } from '../../helper/system/system';
import { AppSystemProp } from '../../helper/system/system-props';
import { platformService } from '../../platform/platform.service';
import { synkraUsageService } from '../billing/usage.service';

/**
 * Synkra AI credits meter.
 *
 * Every AI call is funnelled through aiUsageService.report(). We hook here
 * to increment our own synkra_subscription.aiOpsUsed column, using the
 * token counts AP already reports.
 *
 * Conversion: 1 credit = 1,000 tokens (input + output). Rounds up.
 */

const TOKENS_PER_CREDIT = 1000;
const MIN_CREDITS_PER_CALL = 1;

export function tokensToCredits(inputTokens?: number, outputTokens?: number): number {
  const total = (inputTokens ?? 0) + (outputTokens ?? 0);
  if (total <= 0) return MIN_CREDITS_PER_CALL;
  return Math.max(MIN_CREDITS_PER_CALL, Math.ceil(total / TOKENS_PER_CREDIT));
}

export const synkraAiMeter = (log: FastifyBaseLogger) => ({
  /**
   * Called from the AI usage funnel. Silently no-ops if it cannot
   * resolve a platform owner — better to allow an AI call than to break
   * a customer's workflow on a metering glitch.
   */
  async record(params: {
    platformId: string;
    inputTokens?: number;
    outputTokens?: number;
    source?: string;
  }): Promise<void> {
    try {
      const platform = await platformService(log).getOne(params.platformId as never);
      if (!platform?.ownerId) {
        log.debug(
          { platformId: params.platformId },
          'synkra-ai-meter: no owner resolved — skipping credit record',
        );
        return;
      }
      const credits = tokensToCredits(params.inputTokens, params.outputTokens);
      await synkraUsageService(log).increment(platform.ownerId, 'aiOpsUsed', credits);
      log.info(
        {
          platformId: params.platformId,
          ownerId: platform.ownerId,
          credits,
          inputTokens: params.inputTokens,
          outputTokens: params.outputTokens,
          source: params.source ?? 'chat',
        },
        'synkra-ai-meter: credits recorded',
      );
    } catch (err) {
      log.warn(
        { err, platformId: params.platformId },
        'synkra-ai-meter: failed to record credits (non-blocking)',
      );
    }
  },

  /** Current monthly allowance in credits for a given tier. */
  creditsPerTier(tier: string): number {
    switch (tier) {
      case 'starter':
        return 1000;
      case 'business':
        return 5000;
      case 'pro':
        return 20000;
      default:
        return 0;
    }
  },

  /** Is Synkra AI configured (DeepSeek key present)? */
  isSynkraAiConfigured(): boolean {
    return !!system.get(AppSystemProp.SYNKRA_AI_API_KEY);
  },
});
