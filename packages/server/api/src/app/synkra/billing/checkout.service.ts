import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils';
import { FastifyBaseLogger } from 'fastify';
import { system } from '../../helper/system/system';
import { AppSystemProp } from '../../helper/system/system-props';
import { getPlanLimits, normalizeTier, SynkraTier } from '@activepieces/shared';
import { paystackClient } from './paystack-client';
import { synkraSubscriptionService } from './subscription.service';

function planCodeForTier(tier: SynkraTier): string | null {
  const map: Record<SynkraTier, AppSystemProp | null> = {
    free: null,
    starter: AppSystemProp.SYNKRA_PAYSTACK_PLAN_STARTER,
    business: AppSystemProp.SYNKRA_PAYSTACK_PLAN_BUSINESS,
    pro: AppSystemProp.SYNKRA_PAYSTACK_PLAN_PRO,
  };
  const prop = map[tier];
  if (!prop) return null;
  return system.get(prop) ?? null;
}

export const synkraCheckoutService = (log: FastifyBaseLogger) => ({
  async initialize(params: {
    userId: string;
    email: string;
    tier: unknown;
    callbackUrl: string;
  }): Promise<{ authorizationUrl: string; reference: string; accessCode: string }> {
    const tier = normalizeTier(params.tier);
    if (tier === 'free') {
      throw new ActivepiecesError({
        code: ErrorCode.VALIDATION,
        params: { message: 'Cannot check out the free tier.' },
      });
    }

    const sub = await synkraSubscriptionService(log).getOrCreateForUser(params.userId);
    const plan = getPlanLimits(tier);

    // Apply verified discounts
    let amountZar = plan.priceZar;
    if (sub.studentVerified && plan.studentDiscountZar) {
      amountZar -= plan.studentDiscountZar;
    } else if (sub.communityVerified && plan.communityDiscountZar) {
      amountZar -= plan.communityDiscountZar;
    }
    amountZar = Math.max(0, amountZar);

    const planCode = planCodeForTier(tier);
    const amountKobo = amountZar * 100;

    const result = await paystackClient.initializeTransaction({
      email: params.email,
      amountKobo,
      plan: planCode ?? undefined,
      callbackUrl: params.callbackUrl,
      metadata: {
        userId: params.userId,
        tier,
        source: 'synkra-flow',
      },
    });

    log.info({ userId: params.userId, tier, amountZar, planCode }, 'synkra checkout initialized');

    return {
      authorizationUrl: result.authorization_url,
      reference: result.reference,
      accessCode: result.access_code,
    };
  },
});
