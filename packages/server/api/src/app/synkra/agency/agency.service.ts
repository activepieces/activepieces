import { ActivepiecesError, apId, ErrorCode, isNil, PlatformUsageMetric } from '@activepieces/core-utils';
import { FastifyBaseLogger } from 'fastify';
import { repoFactory } from '../../core/db/repo-factory';
import { SynkraAgency, SynkraAgencyEntity } from './agency.entity';
import { SynkraAgencyClient, SynkraAgencyClientEntity } from './agency-client.entity';

const agencyRepo = repoFactory<SynkraAgency>(SynkraAgencyEntity);
const clientRepo = repoFactory<SynkraAgencyClient>(SynkraAgencyClientEntity);

/**
 * Agency tier definitions.
 * Matches the commercial doc exactly.
 */
export const AGENCY_TIERS = {
  agency_20: {
    name: 'Agency 20',
    feeZar: 699,
    clientLimit: 20,
    wholesaleDiscount: 0.35, // 35% off public Flow price
  },
  agency_100: {
    name: 'Agency 100',
    feeZar: 1499,
    clientLimit: 100,
    wholesaleDiscount: 0.4, // 40% off
  },
  agency_500: {
    name: 'Agency 500',
    feeZar: 2999,
    clientLimit: 500,
    wholesaleDiscount: 0.4, // 40% off
  },
} as const;

export type AgencyTier = keyof typeof AGENCY_TIERS;

/**
 * Public Flow plan prices in ZAR.
 * Source of truth: packages/core/shared/src/lib/synkra/plans.ts
 * Kept here as a lookup table because we apply a discount.
 */
const FLOW_PUBLIC_PRICES: Record<string, number> = {
  starter: 299,
  business: 599,
  pro: 999,
};

export function computeWholesaleZar(params: {
  publicTier: string;
  wholesaleDiscount: number;
}): number {
  const publicPrice = FLOW_PUBLIC_PRICES[params.publicTier];
  if (isNil(publicPrice)) {
    throw new ActivepiecesError({
      code: ErrorCode.VALIDATION,
      params: { message: `Unknown Flow tier: ${params.publicTier}` },
    });
  }
  return Math.round(publicPrice * (1 - params.wholesaleDiscount));
}

export const synkraAgencyService = (log: FastifyBaseLogger) => ({
  // ────────────────────────────────────────────────────────────
  // Agency CRUD
  // ────────────────────────────────────────────────────────────

  async getForUser(userId: string): Promise<SynkraAgency | null> {
    return agencyRepo().findOneBy({ ownerUserId: userId });
  },

  async getOrCreateDraftForUser(userId: string, platformId: string): Promise<SynkraAgency> {
    const existing = await this.getForUser(userId);
    if (!isNil(existing)) return existing;

    const tier = AGENCY_TIERS.agency_20;
    return agencyRepo().save({
      id: apId(),
      ownerUserId: userId,
      platformId,
      name: '',
      tier: 'agency_20',
      status: 'draft',
      clientEnvironmentsLimit: tier.clientLimit,
      wholesaleDiscount: tier.wholesaleDiscount,
      branding: {},
      metadata: {},
      activatedAt: null,
      cancelledAt: null,
    });
  },

  async updateProfile(userId: string, params: { name?: string }): Promise<SynkraAgency> {
    const agency = await this.getForUser(userId);
    if (isNil(agency)) {
      throw new ActivepiecesError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: { message: 'Agency not found for this user' },
      });
    }
    if (params.name !== undefined) {
      await agencyRepo().update({ id: agency.id }, { name: params.name });
    }
    return agencyRepo().findOneByOrFail({ id: agency.id });
  },

  async updateTier(userId: string, tier: AgencyTier): Promise<SynkraAgency> {
    const agency = await this.getForUser(userId);
    if (isNil(agency)) {
      throw new ActivepiecesError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: { message: 'Agency not found for this user' },
      });
    }
    const cfg = AGENCY_TIERS[tier];

    // Cannot downgrade below current client count.
    const clientCount = await clientRepo().count({
      where: { agencyId: agency.id, status: 'active' },
    });
    if (clientCount > cfg.clientLimit) {
      throw new ActivepiecesError({
        code: ErrorCode.VALIDATION,
        params: {
          message: `${cfg.name} allows ${cfg.clientLimit} active clients. You have ${clientCount}. Move clients out first or upgrade higher.`,
        },
      });
    }

    await agencyRepo().update(
      { id: agency.id },
      {
        tier,
        clientEnvironmentsLimit: cfg.clientLimit,
        wholesaleDiscount: cfg.wholesaleDiscount,
      },
    );
    return agencyRepo().findOneByOrFail({ id: agency.id });
  },

  async activate(userId: string): Promise<SynkraAgency> {
    const agency = await this.getForUser(userId);
    if (isNil(agency)) {
      throw new ActivepiecesError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: { message: 'Agency not found for this user' },
      });
    }
    if (agency.status === 'active') return agency;

    await agencyRepo().update(
      { id: agency.id },
      { status: 'active', activatedAt: new Date() },
    );
    log.info({ agencyId: agency.id, userId, tier: agency.tier }, 'synkra-agency: activated');
    return agencyRepo().findOneByOrFail({ id: agency.id });
  },

  async suspend(userId: string): Promise<SynkraAgency> {
    const agency = await this.getForUser(userId);
    if (isNil(agency)) {
      throw new ActivepiecesError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: { message: 'Agency not found for this user' },
      });
    }
    await agencyRepo().update({ id: agency.id }, { status: 'suspended' });
    return agencyRepo().findOneByOrFail({ id: agency.id });
  },

  async updateBranding(userId: string, branding: Record<string, unknown>): Promise<SynkraAgency> {
    const agency = await this.getForUser(userId);
    if (isNil(agency)) {
      throw new ActivepiecesError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: { message: 'Agency not found for this user' },
      });
    }
    await agencyRepo().update({ id: agency.id }, { branding } as never);
    return agencyRepo().findOneByOrFail({ id: agency.id });
  },

  // ────────────────────────────────────────────────────────────
  // Client environments
  // ────────────────────────────────────────────────────────────

  async listClients(agencyId: string): Promise<SynkraAgencyClient[]> {
    return clientRepo().find({
      where: { agencyId },
      order: { created: 'DESC' },
    });
  },

  async getClientByIdOrThrow(clientId: string): Promise<SynkraAgencyClient> {
    const client = await clientRepo().findOneBy({ id: clientId });
    if (isNil(client)) {
      throw new ActivepiecesError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: { message: `Client ${clientId} not found` },
      });
    }
    return client;
  },

  async createClient(params: {
    agencyId: string;
    projectId: string;
    name: string;
    clientTier: string;
  }): Promise<SynkraAgencyClient> {
    const agency = await agencyRepo().findOneBy({ id: params.agencyId });
    if (isNil(agency)) {
      throw new ActivepiecesError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: { message: 'Agency not found' },
      });
    }

    // Enforce client cap.
    const currentCount = await clientRepo().count({ where: { agencyId: params.agencyId } });
    if (currentCount >= agency.clientEnvironmentsLimit) {
      throw new ActivepiecesError({
        code: ErrorCode.QUOTA_EXCEEDED,
        params: {
          message: `Your ${AGENCY_TIERS[agency.tier as AgencyTier].name} allows ${agency.clientEnvironmentsLimit} client environments. You already have ${currentCount}. Upgrade your Agency tier to add more.`,
          metric: PlatformUsageMetric.ACTIVE_FLOWS,
          usage: currentCount,
          limit: agency.clientEnvironmentsLimit,
        },
      });
    }

    const wholesaleZar = computeWholesaleZar({
      publicTier: params.clientTier,
      wholesaleDiscount: agency.wholesaleDiscount,
    });

    return clientRepo().save({
      id: apId(),
      agencyId: params.agencyId,
      projectId: params.projectId,
      name: params.name,
      status: 'draft',
      clientTier: params.clientTier,
      wholesaleMonthlyZar: wholesaleZar,
      metadata: {},
      activatedAt: null,
    });
  },

  async activateClient(clientId: string): Promise<SynkraAgencyClient> {
    const client = await this.getClientByIdOrThrow(clientId);
    if (client.status === 'active') return client;

    await clientRepo().update(
      { id: clientId },
      { status: 'active', activatedAt: new Date() },
    );
    log.info({ clientId, projectId: client.projectId }, 'synkra-agency: client activated');
    return clientRepo().findOneByOrFail({ id: clientId });
  },

  async suspendClient(clientId: string): Promise<SynkraAgencyClient> {
    const client = await this.getClientByIdOrThrow(clientId);
    await clientRepo().update({ id: clientId }, { status: 'suspended' });
    return clientRepo().findOneByOrFail({ id: clientId });
  },

  /**
   * Handover — detach a client environment from this agency.
   * The Flow project stays intact. Only the agency link is severed.
   */
  async transferClient(clientId: string): Promise<SynkraAgencyClient> {
    const client = await this.getClientByIdOrThrow(clientId);
    await clientRepo().update({ id: clientId }, { status: 'transferred' });
    log.info({ clientId, projectId: client.projectId }, 'synkra-agency: client transferred');
    return clientRepo().findOneByOrFail({ id: clientId });
  },

  /**
   * Utility — count active clients for a given agency.
   */
  async countActiveClients(agencyId: string): Promise<number> {
    return clientRepo().count({ where: { agencyId, status: 'active' } });
  },

  /**
   * Utility — sum the wholesale monthly cost the agency owes.
   * Used later by the billing aggregation.
   */
  async sumWholesaleMonthlyZar(agencyId: string): Promise<number> {
    const rows = await clientRepo().find({ where: { agencyId, status: 'active' } });
    return rows.reduce((sum, r) => sum + (r.wholesaleMonthlyZar ?? 0), 0);
  },
});
