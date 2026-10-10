import { ALL_PRINCIPAL_TYPES, PrincipalType } from '@activepieces/shared';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { securityAccess } from '../../core/security/authorization/fastify-security';
import { AGENCY_TIERS, AgencyTier, synkraAgencyService, computeWholesaleZar } from './agency.service';
import { synkraAgencyBillingService } from './billing.service';

const tierSchema = z.enum(['agency_20', 'agency_100', 'agency_500']);

const agencyResponse = z.object({
  id: z.string(),
  name: z.string(),
  tier: z.string(),
  status: z.string(),
  clientEnvironmentsLimit: z.number(),
  wholesaleDiscount: z.number(),
  clientCount: z.number(),
  activeClientCount: z.number(),
  monthlyWholesaleZar: z.number(),
  branding: z.record(z.string(), z.unknown()),
  activatedAt: z.string().nullable(),
  createdAt: z.string(),
});

const clientResponse = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  status: z.string(),
  clientTier: z.string(),
  wholesaleMonthlyZar: z.number(),
  activatedAt: z.string().nullable(),
  createdAt: z.string(),
});

export const synkraAgencyController: FastifyPluginAsyncZod = async (app) => {
  // ────────────────────────────────────────────────────────────
  // Agency — self
  // ────────────────────────────────────────────────────────────

  app.get(
    '/',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: { response: { 200: agencyResponse } },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) throw new Error('Must be signed in.');
      const platformId = (principal as { platform: { id: string } }).platform.id;

      const svc = synkraAgencyService(request.log);
      const agency = await svc.getOrCreateDraftForUser(principal.id, platformId);

      const clients = await svc.listClients(agency.id);
      const activeClients = clients.filter((c) => c.status === 'active');
      const wholesale = activeClients.reduce(
        (sum, c) => sum + (c.wholesaleMonthlyZar ?? 0),
        0,
      );

      return {
        id: agency.id,
        name: agency.name,
        tier: agency.tier,
        status: agency.status,
        clientEnvironmentsLimit: agency.clientEnvironmentsLimit,
        wholesaleDiscount: agency.wholesaleDiscount,
        clientCount: clients.length,
        activeClientCount: activeClients.length,
        monthlyWholesaleZar: wholesale,
        branding: (agency.branding ?? {}) as Record<string, unknown>,
        activatedAt: agency.activatedAt
          ? new Date(agency.activatedAt).toISOString()
          : null,
        createdAt: new Date(agency.created).toISOString(),
      };
    },
  );

  app.patch(
    '/',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        body: z.object({ name: z.string().min(1).max(120).optional() }),
        response: { 200: z.object({ ok: z.boolean() }) },
      },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) throw new Error('Must be signed in.');
      await synkraAgencyService(request.log).updateProfile(principal.id, request.body);
      return { ok: true };
    },
  );

  app.post(
    '/activate',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) throw new Error('Must be signed in.');
      await synkraAgencyService(request.log).activate(principal.id);
      return { ok: true };
    },
  );

  app.post(
    '/suspend',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) throw new Error('Must be signed in.');
      await synkraAgencyService(request.log).suspend(principal.id);
      return { ok: true };
    },
  );

  app.post(
    '/tier',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: { body: z.object({ tier: tierSchema }) },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) throw new Error('Must be signed in.');
      await synkraAgencyService(request.log).updateTier(
        principal.id,
        request.body.tier as AgencyTier,
      );
      return { ok: true };
    },
  );

  app.patch(
    '/branding',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: { body: z.record(z.string(), z.unknown()) },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) throw new Error('Must be signed in.');
      await synkraAgencyService(request.log).updateBranding(principal.id, request.body);
      return { ok: true };
    },
  );

  // ────────────────────────────────────────────────────────────
  // Clients
  // ────────────────────────────────────────────────────────────

  app.get(
    '/clients',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        response: { 200: z.object({ clients: z.array(clientResponse) }) },
      },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) throw new Error('Must be signed in.');
      const svc = synkraAgencyService(request.log);
      const agency = await svc.getForUser(principal.id);
      if (!agency) return { clients: [] };
      const clients = await svc.listClients(agency.id);
      return {
        clients: clients.map((c) => ({
          id: c.id,
          projectId: c.projectId,
          name: c.name,
          status: c.status,
          clientTier: c.clientTier,
          wholesaleMonthlyZar: c.wholesaleMonthlyZar,
          activatedAt: c.activatedAt ? new Date(c.activatedAt).toISOString() : null,
          createdAt: new Date(c.created).toISOString(),
        })),
      };
    },
  );

  app.post(
    '/clients',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        body: z.object({
          name: z.string().min(1).max(120),
          clientTier: z.enum(['starter', 'business', 'pro']),
        }),
        response: { 200: z.object({ id: z.string(), projectId: z.string() }) },
      },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) throw new Error('Must be signed in.');
      const platformId = (principal as { platform: { id: string } }).platform.id;

      // Create a Flow project for the client env, then link it.
      const { projectService } = await import('../../project/project-service');
      const project = await projectService(request.log).create({
        displayName: request.body.name,
        platformId,
        ownerId: principal.id,
        type: 'TEAM' as never,
      });

      const svc = synkraAgencyService(request.log);
      const agency = await svc.getOrCreateDraftForUser(principal.id, platformId);
      const client = await svc.createClient({
        agencyId: agency.id,
        projectId: project.id,
        name: request.body.name,
        clientTier: request.body.clientTier,
      });

      return { id: client.id, projectId: client.projectId };
    },
  );

  app.post(
    '/clients/:id/activate',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        params: z.object({ id: z.string() }),
      },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) throw new Error('Must be signed in.');
      await synkraAgencyService(request.log).activateClient(request.params.id);
      return { ok: true };
    },
  );

  app.post(
    '/clients/:id/suspend',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        params: z.object({ id: z.string() }),
      },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) throw new Error('Must be signed in.');
      await synkraAgencyService(request.log).suspendClient(request.params.id);
      return { ok: true };
    },
  );

  app.post(
    '/clients/:id/transfer',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        params: z.object({ id: z.string() }),
      },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) throw new Error('Must be signed in.');
      await synkraAgencyService(request.log).transferClient(request.params.id);
      return { ok: true };
    },
  );

  // ────────────────────────────────────────────────────────────
  // Pricing reference (public info — helps UI show wholesale calc)
  // ────────────────────────────────────────────────────────────

  app.get(
    '/pricing',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        response: {
          200: z.object({
            tiers: z.record(z.string(), z.object({
              name: z.string(),
              feeZar: z.number(),
              clientLimit: z.number(),
              wholesaleDiscount: z.number(),
            })),
            publicTiers: z.record(z.string(), z.number()),
          }),
        },
      },
    },
    async () => ({
      tiers: Object.fromEntries(
        Object.entries(AGENCY_TIERS).map(([k, v]) => [
          k,
          { name: v.name, feeZar: v.feeZar, clientLimit: v.clientLimit, wholesaleDiscount: v.wholesaleDiscount },
        ]),
      ),
      publicTiers: { starter: 299, business: 599, pro: 999 },
    }),
  );

  app.get(
    '/billing',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) throw new Error('Must be signed in.');
      const svc = synkraAgencyService(request.log);
      const agency = await svc.getForUser(principal.id);
      if (!agency) {
        return {
          agencyId: '',
          tier: 'agency_20',
          tierName: 'Agency 20',
          status: 'draft',
          agencyFeeZar: 0,
          clients: [],
          activeClientCount: 0,
          draftClientCount: 0,
          suspendedClientCount: 0,
          clientWholesaleTotalZar: 0,
          clientPublicTotalZar: 0,
          clientSavingsTotalZar: 0,
          monthlyTotalZar: 0,
          nextBillingDate: null,
          currency: 'ZAR',
        };
      }
      return synkraAgencyBillingService(request.log).getSummary(agency.id);
    },
  );

  app.post(
    '/wholesale-preview',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        body: z.object({ clientTier: z.enum(['starter', 'business', 'pro']), agencyTier: tierSchema }),
      },
    },
    async (request) => {
      const discount = AGENCY_TIERS[request.body.agencyTier as AgencyTier].wholesaleDiscount;
      const price = computeWholesaleZar({
        publicTier: request.body.clientTier,
        wholesaleDiscount: discount,
      });
      return { wholesaleZar: price, discount };
    },
  );
};
