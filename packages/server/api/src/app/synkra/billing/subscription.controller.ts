import { ALL_PRINCIPAL_TYPES, PrincipalType, getPlanLimits } from '@activepieces/shared';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { securityAccess } from '../../core/security/authorization/fastify-security';
import { synkraSubscriptionService } from './subscription.service';
import { synkraUsageService } from './usage.service';

export const synkraSubscriptionController: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        response: {
          200: z.object({
            tier: z.string(),
            status: z.string(),
            priceZar: z.number(),
            studentVerified: z.boolean(),
            communityVerified: z.boolean(),
            currentPeriodEnd: z.string().nullable(),
            cancelAtPeriodEnd: z.boolean(),
            scheduledChange: z
              .object({
                kind: z.enum(['downgrade', 'cancel']),
                toTier: z.string().optional(),
              })
              .nullable(),
            limits: z.record(z.string(), z.unknown()),
          }),
        },
      },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) {
        return {
          tier: 'free',
          status: 'anonymous',
          priceZar: 0,
          studentVerified: false,
          communityVerified: false,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          scheduledChange: null,
          limits: getPlanLimits('free') as unknown as Record<string, unknown>,
        };
      }
      const sub = await synkraSubscriptionService(request.log).getOrCreateForUser(principal.id);
      const limits = getPlanLimits(sub.tier);
      const meta = (sub.metadata ?? {}) as Record<string, unknown>;
      const sc = meta['scheduledChange'] as
        | { kind: 'downgrade' | 'cancel'; toTier?: string }
        | undefined;
      return {
        tier: sub.tier,
        status: sub.status,
        priceZar: limits.priceZar,
        studentVerified: sub.studentVerified,
        communityVerified: sub.communityVerified,
        currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toISOString() : null,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        scheduledChange: sc ? { kind: sc.kind, toTier: sc.toTier } : null,
        limits: limits as unknown as Record<string, unknown>,
      };
    },
  );

  app.get(
    '/usage',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        response: {
          200: z.object({
            aiOpsUsed: z.number(),
            smsUsed: z.number(),
            whatsappUsed: z.number(),
            voiceMinutesUsed: z.number(),
            emailsUsed: z.number(),
            storageBytesUsed: z.number(),
            usagePeriodStart: z.string().nullable(),
            usagePeriodEnd: z.string().nullable(),
          }),
        },
      },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) {
        return {
          aiOpsUsed: 0, smsUsed: 0, whatsappUsed: 0, voiceMinutesUsed: 0,
          emailsUsed: 0, storageBytesUsed: 0,
          usagePeriodStart: null, usagePeriodEnd: null,
        };
      }
      return synkraUsageService(request.log).getUsage(principal.id);
    },
  );

  app.post(
    '/cancel',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: { response: { 200: z.object({ ok: z.boolean(), currentPeriodEnd: z.string().nullable() }) } },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) throw new Error('Must be signed in.');
      const svc = synkraSubscriptionService(request.log);
      const sub = await svc.scheduleCancel(principal.id);
      return {
        ok: true,
        currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toISOString() : null,
      };
    },
  );

  app.post(
    '/reactivate',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: { response: { 200: z.object({ ok: z.boolean() }) } },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) throw new Error('Must be signed in.');
      await synkraSubscriptionService(request.log).reactivate(principal.id);
      return { ok: true };
    },
  );

  app.post(
    '/downgrade',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        body: z.object({ toTier: z.enum(['free', 'starter', 'business']) }),
        response: { 200: z.object({ ok: z.boolean(), currentPeriodEnd: z.string().nullable() }) },
      },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) throw new Error('Must be signed in.');
      const svc = synkraSubscriptionService(request.log);
      const sub = await svc.scheduleDowngrade(principal.id, request.body.toTier);
      return {
        ok: true,
        currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toISOString() : null,
      };
    },
  );
};
