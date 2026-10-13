import { ALL_PRINCIPAL_TYPES, PrincipalType, getPlanLimits } from '@activepieces/shared';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { securityAccess } from '../../core/security/authorization/fastify-security';
import { platformService } from '../../platform/platform.service';
import { synkraSubscriptionService } from '../billing/subscription.service';
import { synkraUsageService } from '../billing/usage.service';

export const synkraDashboardController: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/summary',
    {
      config: { security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES) },
      schema: {
        response: {
          200: z.object({
            tier: z.string(),
            status: z.string(),
            plan: z.object({
              name: z.string(),
              executions: z.number(),
              aiOps: z.number(),
              emails: z.number(),
              storageGb: z.number(),
              seats: z.number(),
            }),
            usage: z.object({
              executionsThisMonth: z.number(),
              aiOpsUsed: z.number(),
              emailsUsed: z.number(),
              smsUsed: z.number(),
              whatsappUsed: z.number(),
              storageBytesUsed: z.number(),
            }),
            recentRuns: z.array(
              z.object({
                id: z.string(),
                flowId: z.string(),
                flowName: z.string(),
                status: z.string(),
                createdAt: z.string(),
              }),
            ),
            connectedIntegrations: z.number(),
            activeWorkflows: z.number(),
          }),
        },
      },
    },
    async (request) => {
      const principal = request.principal;
      if (principal.type !== PrincipalType.USER) {
        throw new Error('Must be signed in.');
      }

      const platformId = (principal as { platform: { id: string } }).platform.id;

      // Resolve platform owner (the account we bill against).
      let ownerId = principal.id;
      try {
        const p = await platformService(request.log).getOne(platformId as never);
        if (p?.ownerId) ownerId = p.ownerId;
      } catch { /* fall through */ }

      const sub = await synkraSubscriptionService(request.log).getOrCreateForUser(ownerId);
      const plan = getPlanLimits(sub.tier);
      const usage = await synkraUsageService(request.log).getUsage(ownerId);

      // Recent runs (last 5, across all projects owned by this user).
      let recentRuns: { id: string; flowId: string; flowName: string; status: string; createdAt: string }[] = [];
      try {
        const { flowRunRepo } = await import('../../flows/flow-run/flow-run-service');
        const { flowRepo } = await import('../../flows/flow/flow.repo');
        const rows = await flowRunRepo()
          .createQueryBuilder('fr')
          .innerJoin('project', 'p', 'p.id = fr."projectId"')
          .where('p."platformId" = :platformId', { platformId })
          .orderBy('fr.created', 'DESC')
          .limit(5)
          .getMany();
        const flowIds = [...new Set(rows.map((r) => r.flowId))];
        const flows = flowIds.length
          ? await flowRepo().find({
              where: { id: flowIds as never },
              relations: { publishedVersion: true, versions: true } as never,
            })
          : [];
        const nameById = new Map(
          flows.map((f) => [
            f.id,
            (f.publishedVersion as { displayName?: string } | undefined)?.displayName
              ?? ((f as { versions?: { displayName: string }[] }).versions?.[0]?.displayName)
              ?? 'Untitled flow',
          ]),
        );
        recentRuns = rows.map((r) => ({
          id: r.id,
          flowId: r.flowId,
          flowName: nameById.get(r.flowId) ?? 'Untitled flow',
          status: r.status,
          createdAt: new Date(r.created).toISOString(),
        }));
      } catch (err) {
        request.log.warn({ err }, 'dashboard: recent runs query failed');
      }

      // Connected integrations count.
      let connectedIntegrations = 0;
      try {
        const { appConnectionService } = await import('../../app-connection/app-connection-service/app-connection-service');
        const conns = await appConnectionService(request.log).list({
          projectId: null,
          platformId,
          cursorRequest: null,
          limit: 100,
          displayName: undefined,
          status: undefined,
          pieceName: undefined,
          scope: undefined,
          ownerIds: [],
          externalIds: [],
        });
        connectedIntegrations = conns.data.length;
      } catch (err) {
        request.log.warn({ err }, 'dashboard: connections query failed');
      }

      // Active workflows count.
      let activeWorkflows = 0;
      try {
        const { flowRepo } = await import('../../flows/flow/flow.repo');
        const { FlowStatus } = await import('@activepieces/shared');
        const rows = await flowRepo()
          .createQueryBuilder('f')
          .innerJoin('project', 'p', 'p.id = f."projectId"')
          .where('p."platformId" = :platformId', { platformId })
          .andWhere('f.status = :status', { status: FlowStatus.ENABLED })
          .getCount();
        activeWorkflows = rows;
      } catch (err) {
        request.log.warn({ err }, 'dashboard: active workflows query failed');
      }

      // Runs this month.
      let executionsThisMonth = 0;
      try {
        const { flowRunRepo } = await import('../../flows/flow-run/flow-run-service');
        const now = new Date();
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        executionsThisMonth = await flowRunRepo()
          .createQueryBuilder('fr')
          .innerJoin('project', 'p', 'p.id = fr."projectId"')
          .where('p."platformId" = :platformId', { platformId })
          .andWhere('fr.created >= :start', { start: monthStart.toISOString() })
          .getCount();
      } catch (err) {
        request.log.warn({ err }, 'dashboard: runs count failed');
      }

      return {
        tier: sub.tier,
        status: sub.status,
        plan: {
          name: plan.name,
          executions: plan.executions,
          aiOps: plan.aiOps,
          emails: plan.emails,
          storageGb: plan.storageGb,
          seats: plan.seats,
        },
        usage: {
          executionsThisMonth,
          aiOpsUsed: usage.aiOpsUsed,
          emailsUsed: usage.emailsUsed,
          smsUsed: usage.smsUsed,
          whatsappUsed: usage.whatsappUsed,
          storageBytesUsed: usage.storageBytesUsed,
        },
        recentRuns,
        connectedIntegrations,
        activeWorkflows,
      };
    },
  );
};
