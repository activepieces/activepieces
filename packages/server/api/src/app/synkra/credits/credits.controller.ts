import { ALL_PRINCIPAL_TYPES, PrincipalType } from '@activepieces/shared';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { securityAccess } from '../../core/security/authorization/fastify-security';
import { platformService } from '../../platform/platform.service';
import { userService } from '../../user/user-service';
import { userIdentityService } from '../../authentication/user-identity/user-identity-service';
import { paystackClient } from '../billing/paystack-client';
import { synkraCreditLotService } from './credit-lot.service';
import { ADDON_PACKS, getPack } from './pack-catalog';

const packSchema = z.object({
  id: z.string(),
  kind: z.enum(['ai', 'email']),
  amount: z.number(),
  priceZar: z.number(),
  label: z.string(),
  description: z.string(),
});

export const synkraCreditsController: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/packs',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        response: {
          200: z.object({ packs: z.array(packSchema) }),
        },
      },
    },
    async () => ({ packs: ADDON_PACKS }),
  );

  app.get(
    '/balance',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        response: {
          200: z.object({
            ai: z.number(),
            email: z.number(),
            lots: z.array(
              z.object({
                id: z.string(),
                kind: z.string(),
                remaining: z.number(),
                purchased: z.number(),
                expiresAt: z.string(),
              }),
            ),
          }),
        },
      },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) {
        return { ai: 0, email: 0, lots: [] };
      }
      const platformId = (principal as { platform: { id: string } }).platform.id;
      let ownerId = principal.id;
      try {
        const p = await platformService(request.log).getOne(platformId as never);
        if (p?.ownerId) ownerId = p.ownerId;
      } catch { /* fall through */ }

      const svc = synkraCreditLotService(request.log);
      const [ai, email] = await Promise.all([
        svc.getAvailable(ownerId, 'ai'),
        svc.getAvailable(ownerId, 'email'),
      ]);
      const lots = await svc.listForUser(ownerId);

      return {
        ai,
        email,
        lots: lots.map((l) => ({
          id: l.id,
          kind: l.kind,
          remaining: l.amountRemaining,
          purchased: l.amountPurchased,
          expiresAt: new Date(l.expiresAt).toISOString(),
        })),
      };
    },
  );

  app.post(
    '/purchase',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        body: z.object({
          packId: z.string(),
          callbackUrl: z.string().url(),
        }),
        response: {
          200: z.object({
            authorizationUrl: z.string(),
            reference: z.string(),
          }),
        },
      },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) throw new Error('Must be signed in.');

      const pack = getPack(request.body.packId);
      if (!pack) throw new Error('Unknown pack');

      const user = await userService(request.log).getOneOrFail({ id: principal.id });
      const ident = await userIdentityService(request.log).getOneOrFail({
        id: user.identityId,
      });

      const platformId = (principal as { platform: { id: string } }).platform.id;
      let ownerId = principal.id;
      try {
        const p = await platformService(request.log).getOne(platformId as never);
        if (p?.ownerId) ownerId = p.ownerId;
      } catch { /* fall through */ }

      const result = await paystackClient.initializeTransaction({
        email: ident.email,
        amountKobo: pack.priceZar * 100,
        callbackUrl: request.body.callbackUrl,
        metadata: {
          purchaseType: 'addon_pack',
          packId: pack.id,
          kind: pack.kind,
          amount: pack.amount,
          priceZar: pack.priceZar,
          userId: ownerId,
          platformId,
        },
      });

      request.log.info(
        { userId: ownerId, packId: pack.id, priceZar: pack.priceZar },
        'credits: purchase initialized',
      );

      return {
        authorizationUrl: result.authorization_url,
        reference: result.reference,
      };
    },
  );
};
