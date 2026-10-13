import { ALL_PRINCIPAL_TYPES } from '@activepieces/shared';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { securityAccess } from '../../core/security/authorization/fastify-security';
import { system } from '../../helper/system/system';
import { AppSystemProp } from '../../helper/system/system-props';
import { synkraSubscriptionService } from './subscription.service';
import { synkraCreditLotService } from '../credits/credit-lot.service';

export const paystackWebhookController: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/webhook',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        body: z.object({
          event: z.string(),
          data: z.record(z.string(), z.unknown()),
        }),
      },
    },
    async (request, reply) => {
      // Signature verification when secret is configured
      const expectedSecret = system.get(AppSystemProp.SYNKRA_PAYSTACK_WEBHOOK_SECRET);
      if (expectedSecret) {
        const got = request.headers['x-paystack-signature'];
        const crypto = await import('crypto');
        const hmac = crypto.createHmac('sha512', expectedSecret);
        hmac.update(JSON.stringify(request.body));
        const expected = hmac.digest('hex');
        if (got !== expected) {
          return reply.status(401).send({ ok: false, error: 'invalid_signature' });
        }
      }

      const { event, data } = request.body;
      const log = request.log;
      const svc = synkraSubscriptionService(log);

      try {
        if (event === 'charge.success') {
          const meta = (data.metadata as Record<string, unknown>) ?? {};

          // --- Add-on pack purchase ---
          if (meta['purchaseType'] === 'addon_pack') {
            const userId = meta['userId'] as string | undefined;
            const platformId = meta['platformId'] as string | undefined;
            const kind = meta['kind'] as 'ai' | 'email' | undefined;
            const amount = meta['amount'] as number | undefined;
            const priceZar = meta['priceZar'] as number | undefined;
            const reference = data.reference as string | undefined;

            if (!userId || !platformId || !kind || !amount || !priceZar || !reference) {
              log.warn({ meta }, 'addon webhook: incomplete metadata');
              return { ok: true, skipped: 'incomplete_addon_metadata' };
            }

            await synkraCreditLotService(log).createFromPurchase({
              userId,
              platformId,
              kind,
              amount,
              priceZar,
              paystackReference: reference,
              metadata: { packId: meta['packId'] },
            });
            log.info(
              { userId, kind, amount, reference },
              'addon webhook: credit lot created',
            );
            return { ok: true, addon: true };
          }

          // --- Subscription upgrade ---
          const userId = meta['userId'] as string | undefined;
          const tier = meta['tier'] as string | undefined;
          if (!userId || !tier) {
            log.warn({ event }, 'charge.success missing userId/tier in metadata');
            return { ok: true, skipped: 'missing_metadata' };
          }
          const planData = (data.plan as Record<string, unknown>) ?? {};
          const customerData = (data.customer as Record<string, unknown>) ?? {};
          const subData = (data.subscription as Record<string, unknown>) ?? {};
          const interval = planData['interval'] as string | undefined;
          await svc.updateTier(userId, {
            tier,
            status: 'active',
            paystackCustomerCode: (customerData['customer_code'] as string) ?? null,
            paystackSubscriptionCode: (subData['subscription_code'] as string) ?? null,
            paystackPlanCode: (planData['plan_code'] as string) ?? null,
            currentPeriodStart: new Date(),
            currentPeriodEnd: interval
              ? new Date(Date.now() + (interval === 'annually' ? 365 : 30) * 86_400_000)
              : null,
            cancelAtPeriodEnd: false,
          });
          log.info({ userId, tier }, 'synkra subscription upgraded');
        } else if (event === 'subscription.disable' || event === 'subscription.not_renew') {
          const subCode = data['subscription_code'] as string | undefined;
          if (!subCode) {
            log.warn({ event }, 'subscription event missing subscription_code');
            return { ok: true, skipped: 'missing_subscription_code' };
          }
          const existing = await svc.findByPaystackSubscriptionCode(subCode);
          if (!existing) {
            log.warn({ subCode }, 'unknown subscription_code — ignoring');
            return { ok: true, skipped: 'unknown_subscription' };
          }
          if (event === 'subscription.disable') {
            await svc.updateTier(existing.userId, { tier: 'free', status: 'expired', cancelAtPeriodEnd: true });
            log.info({ userId: existing.userId }, 'subscription disabled → downgraded to free');
          } else {
            await svc.cancelByPaystackCode(subCode);
            log.info({ userId: existing.userId }, 'subscription marked cancelled at period end');
          }
        } else if (event === 'subscription.create') {
          log.info({ event }, 'subscription.create received (no-op; charge.success handles upgrade)');
        } else {
          log.debug({ event }, 'unhandled paystack event');
        }
        return { ok: true };
      } catch (err) {
        log.error({ err, event }, 'paystack webhook handling failed');
        return reply.status(500).send({ ok: false, error: 'processing_failed' });
      }
    },
  );
};
