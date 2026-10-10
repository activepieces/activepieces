import { randomBytes } from 'node:crypto';
import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/core-utils';
import { FastifyBaseLogger } from 'fastify';
import { repoFactory } from '../../core/db/repo-factory';
import { projectRepo } from '../../project/project-repo';
import { userService } from '../../user/user-service';
import { SynkraAgencyClient, SynkraAgencyClientEntity } from './agency-client.entity';
import { SynkraAgency, SynkraAgencyEntity } from './agency.entity';

const clientRepo = repoFactory<SynkraAgencyClient>(SynkraAgencyClientEntity);
const agencyRepo = repoFactory<SynkraAgency>(SynkraAgencyEntity);

function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

export const synkraAgencyPortalService = (log: FastifyBaseLogger) => ({
  async enablePortal(clientId: string): Promise<{ portalToken: string; portalUrl: string }> {
    const client = await clientRepo().findOneBy({ id: clientId });
    if (isNil(client)) {
      throw new ActivepiecesError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: { message: 'Client not found' },
      });
    }
    const token = client.portalToken ?? generateToken();
    await clientRepo().update(
      { id: clientId },
      { portalToken: token, portalEnabled: true },
    );
    return {
      portalToken: token,
      portalUrl: `/portal/${token}`,
    };
  },

  async disablePortal(clientId: string): Promise<void> {
    await clientRepo().update(
      { id: clientId },
      { portalEnabled: false },
    );
  },

  /**
   * Public read — called by anyone holding the token.
   * Returns only the safe subset of client data.
   */
  async getPublicView(token: string): Promise<{
    agencyName: string;
    clientName: string;
    status: string;
    clientTier: string;
    branding: Record<string, unknown>;
    usage: {
      executionsThisMonth: number;
      activeWorkflows: number;
      aiCreditsUsed: number;
    };
    supportEmail: string | null;
    welcomeMessage: string | null;
  }> {
    const client = await clientRepo().findOneBy({
      portalToken: token,
      portalEnabled: true,
    });
    if (isNil(client)) {
      throw new ActivepiecesError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: { message: 'Portal not found or disabled' },
      });
    }

    const agency = await agencyRepo().findOneBy({ id: client.agencyId });
    if (isNil(agency)) {
      throw new ActivepiecesError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: { message: 'Agency not found' },
      });
    }

    // Best-effort usage snapshot from the client's Flow project.
    let executionsThisMonth = 0;
    let activeWorkflows = 0;
    try {
      const { flowRunRepo } = await import('../../flows/flow-run/flow-run-service');
      const { FlowStatus, RunEnvironment } = await import('@activepieces/shared');
      const now = new Date();
      const monthStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
      );
      executionsThisMonth = await flowRunRepo()
        .createQueryBuilder('fr')
        .where('fr."projectId" = :projectId', { projectId: client.projectId })
        .andWhere('fr.environment = :env', { env: RunEnvironment.PRODUCTION })
        .andWhere('fr.created >= :start', { start: monthStart.toISOString() })
        .getCount();
      const { flowRepo } = await import('../../flows/flow/flow.repo');
      activeWorkflows = await flowRepo().count({
        where: { projectId: client.projectId, status: FlowStatus.ENABLED },
      });
    } catch (err) {
      log.warn({ err, clientId: client.id }, 'portal: usage snapshot failed');
    }

    // AI credits from the subscription row (owned by the agency for this client).
    let aiCreditsUsed = 0;
    try {
      const { synkraSubscriptionService } = await import('../billing/subscription.service');
      const sub = await synkraSubscriptionService(log).getForUser(agency.ownerUserId);
      aiCreditsUsed = sub?.aiOpsUsed ?? 0;
    } catch { /* non-blocking */ }

    const branding = (agency.branding ?? {}) as Record<string, unknown>;

    // Mark as viewed.
    await clientRepo().update(
      { id: client.id },
      { portalLastViewedAt: new Date() },
    );

    return {
      agencyName: agency.name || 'Your agency',
      clientName: client.name,
      status: client.status,
      clientTier: client.clientTier,
      branding,
      usage: {
        executionsThisMonth,
        activeWorkflows,
        aiCreditsUsed,
      },
      supportEmail: (branding.supportEmail as string) ?? null,
      welcomeMessage: (branding.welcomeMessage as string) ?? null,
    };
  },
});
