import { ALL_PRINCIPAL_TYPES, PrincipalType, getPlanLimits } from '@activepieces/shared';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { securityAccess } from '../../core/security/authorization/fastify-security';
import { platformService } from '../../platform/platform.service';
import { synkraSubscriptionService } from '../billing/subscription.service';
import { synkraUsageService } from '../billing/usage.service';

export const synkraAiBalanceController: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/balance',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        response: {
          200: z.object({
            tier: z.string(),
            used: z.number(),
            limit: z.number(),
            remaining: z.number(),
            percentUsed: z.number(),
            exhausted: z.boolean(),
          }),
        },
      },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) {
        return {
          tier: 'anonymous',
          used: 0,
          limit: 0,
          remaining: 0,
          percentUsed: 0,
          exhausted: true,
        };
      }

      // Resolve the platform owner (the account we bill against).
      const platformId = (principal as { platform?: { id?: string } }).platform?.id;
      let ownerId = principal.id;
      if (platformId) {
        try {
          const p = await platformService(request.log).getOne(platformId as never);
          if (p?.ownerId) ownerId = p.ownerId;
        } catch {
          /* fall through to principal */
        }
      }

      const sub = await synkraSubscriptionService(request.log).getOrCreateForUser(ownerId);
      const plan = getPlanLimits(sub.tier);
      const usage = await synkraUsageService(request.log).getUsage(ownerId);
      const limit = plan.aiOps;
      const used = usage.aiOpsUsed;
      const remaining = Math.max(0, limit - used);
      const percentUsed = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
      return {
        tier: sub.tier,
        used,
        limit,
        remaining,
        percentUsed,
        exhausted: limit > 0 && used >= limit,
      };
    },
  );
};
