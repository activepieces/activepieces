import { ALL_PRINCIPAL_TYPES, PrincipalType } from '@activepieces/shared';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { securityAccess } from '../../core/security/authorization/fastify-security';
import { synkraAgencyPortalService } from './portal.service';

export const synkraAgencyPortalController: FastifyPluginAsyncZod = async (app) => {
  // ────────────────────────────────────────────────────────────
  // Admin endpoints (agency owner only)
  // ────────────────────────────────────────────────────────────

  app.post(
    '/clients/:id/portal/enable',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        params: z.object({ id: z.string() }),
        response: {
          200: z.object({ portalToken: z.string(), portalUrl: z.string() }),
        },
      },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) throw new Error('Must be signed in.');
      return synkraAgencyPortalService(request.log).enablePortal(request.params.id);
    },
  );

  app.post(
    '/clients/:id/portal/disable',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: { params: z.object({ id: z.string() }) },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) throw new Error('Must be signed in.');
      await synkraAgencyPortalService(request.log).disablePortal(request.params.id);
      return { ok: true };
    },
  );

  // ────────────────────────────────────────────────────────────
  // Public endpoint — token-based, no auth required
  // ────────────────────────────────────────────────────────────

  app.get(
    '/public/:token',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        params: z.object({ token: z.string() }),
        response: {
          200: z.object({
            agencyName: z.string(),
            clientName: z.string(),
            status: z.string(),
            clientTier: z.string(),
            branding: z.record(z.string(), z.unknown()),
            usage: z.object({
              executionsThisMonth: z.number(),
              activeWorkflows: z.number(),
              aiCreditsUsed: z.number(),
            }),
            supportEmail: z.string().nullable(),
            welcomeMessage: z.string().nullable(),
            amountOwedZar: z.number().nullable(),
            currency: z.string(),
          }),
        },
      },
    },
    async (request) => {
      return synkraAgencyPortalService(request.log).getPublicView(request.params.token);
    },
  );
};
