import { ActivepiecesError, ErrorCode, PlatformUsageMetric } from '@activepieces/core-utils'
import { FlowStatus, PlatformId, ProjectType, RunEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowRepo } from '../../flows/flow/flow.repo'
import { projectRepo } from '../../project/project-repo'
import { userRepo } from '../../user/user-service'
import { getPlanLimits } from '@activepieces/shared'
import { synkraSubscriptionService } from './subscription.service'
import { platformService } from '../../platform/platform.service'
import { synkraUsageService, MeterField } from './usage.service'

/**
 * Synkra tier enforcement.
 *
 * Reads the platform owner's subscription and throws QUOTA_EXCEEDED
 * whenever a paid action would exceed their tier.
 *
 * Called from:
 *   - flow.service.ts  (publish → checkActiveWorkflowLimit)
 *   - platform-project-service.ts  (create → checkProjectLimit)
 *   - user-invitation.service.ts  (invite → checkSeatLimit)
 */
export const synkraEnforcement = (log: FastifyBaseLogger) => ({
  async checkActiveWorkflowLimit(projectId: string): Promise<void> {
    const ownerUserId = await resolvePlatformOwnerFromProject(projectId, log)
    if (!ownerUserId) return

    const sub = await synkraSubscriptionService(log).getOrCreateForUser(ownerUserId)
    const plan = getPlanLimits(sub.tier)

    const activeCount = await flowRepo().count({
      where: { projectId, status: FlowStatus.ENABLED },
    })

    if (activeCount >= plan.activeWorkflows) {
      throw new ActivepiecesError({
        code: ErrorCode.QUOTA_EXCEEDED,
        params: {
          metric: PlatformUsageMetric.ACTIVE_FLOWS,
          message: `Your ${plan.name} plan allows ${plan.activeWorkflows} active workflows. You currently have ${activeCount}.`,
          usage: activeCount,
          limit: plan.activeWorkflows,
        },
      })
    }
  },

  async checkProjectLimit(platformId: string): Promise<void> {
    const ownerUserId = await resolvePlatformOwner(platformId, log)
    if (!ownerUserId) return

    const sub = await synkraSubscriptionService(log).getOrCreateForUser(ownerUserId)
    const plan = getPlanLimits(sub.tier)

    const projectCount = await projectRepo().count({
      where: { platformId, type: ProjectType.TEAM },
    })

    if (projectCount >= plan.workspaces) {
      throw new ActivepiecesError({
        code: ErrorCode.QUOTA_EXCEEDED,
        params: {
          metric: PlatformUsageMetric.ACTIVE_FLOWS,
          message: `Your ${plan.name} plan allows ${plan.workspaces} workspace${plan.workspaces === 1 ? '' : 's'}. You currently have ${projectCount}.`,
          usage: projectCount,
          limit: plan.workspaces,
        },
      })
    }
  },

  async checkSeatLimit(platformId: string): Promise<void> {
    const ownerUserId = await resolvePlatformOwner(platformId, log)
    if (!ownerUserId) return

    const sub = await synkraSubscriptionService(log).getOrCreateForUser(ownerUserId)
    const plan = getPlanLimits(sub.tier)

    const userCount = await userRepo().count({
      where: { platformId },
    })

    if (userCount >= plan.seats) {
      throw new ActivepiecesError({
        code: ErrorCode.QUOTA_EXCEEDED,
        params: {
          metric: PlatformUsageMetric.USERS,
          message: `Your ${plan.name} plan allows ${plan.seats} seat${plan.seats === 1 ? '' : 's'}. You currently have ${userCount}.`,
          usage: userCount,
          limit: plan.seats,
        },
      })
    }
  },
  async checkEmailLimit(userId: string, n = 1): Promise<void> {
    await assertMeterBelowLimit(userId, 'emailsUsed', 'emails', n, log)
  },
  async checkAiOpsLimit(userId: string, n = 1): Promise<void> {
    await assertMeterBelowLimit(userId, 'aiOpsUsed', 'aiOps', n, log)
  },
  async checkSmsLimit(userId: string, n = 1): Promise<void> {
    await assertMeterBelowLimit(userId, 'smsUsed', 'sms', n, log)
  },
  async checkWhatsappLimit(userId: string, n = 1): Promise<void> {
    await assertMeterBelowLimit(userId, 'whatsappUsed', 'whatsapp', n, log)
  },
  async checkVoiceLimit(userId: string, minutes = 1): Promise<void> {
    await assertMeterBelowLimit(userId, 'voiceMinutesUsed', 'voiceMinutes', minutes, log)
  },
  async checkStorageLimit(userId: string, addBytes: number): Promise<void> {
    const sub = await synkraSubscriptionService(log).getOrCreateForUser(userId)
    const plan = getPlanLimits(sub.tier)
    const used = Number(sub.storageBytesUsed ?? 0)
    const limitBytes = plan.storageGb * 1024 * 1024 * 1024
    if (used + addBytes > limitBytes) {
      throw new ActivepiecesError({
        code: ErrorCode.QUOTA_EXCEEDED,
        params: {
          metric: PlatformUsageMetric.ACTIVE_FLOWS,
          message: `Your ${plan.name} plan allows ${plan.storageGb} GB of storage. You're using ${(used / 1024 / 1024 / 1024).toFixed(2)} GB.`,
          usage: used,
          limit: limitBytes,
        },
      })
    }
  },

})

async function resolvePlatformOwner(platformId: PlatformId, log: FastifyBaseLogger): Promise<string | null> {
  try {
    const platform = await platformService(log).getOne(platformId)
    return platform?.ownerId ?? null
  } catch {
    log.warn({ platformId }, 'synkra: could not resolve platform owner for enforcement')
    return null
  }
}

async function resolvePlatformOwnerFromProject(projectId: string, log: FastifyBaseLogger): Promise<string | null> {
  try {
    const project = await projectRepo().findOneBy({ id: projectId })
    if (!project) return null
    return await resolvePlatformOwner(project.platformId as PlatformId, log)
  } catch {
    return null
  }
}


async function assertMeterBelowLimit(
  userId: string,
  field: MeterField,
  planKey: 'emails' | 'aiOps' | 'sms' | 'whatsapp' | 'voiceMinutes',
  delta: number,
  log: FastifyBaseLogger,
): Promise<void> {
  const svc = synkraUsageService(log)
  const sub = await synkraSubscriptionService(log).getOrCreateForUser(userId)
  const plan = getPlanLimits(sub.tier)
  const limit = plan[planKey]
  const usage = await svc.getUsage(userId)
  const used = usage[field]
  if (limit > 0 && used + delta > limit) {
    throw new ActivepiecesError({
      code: ErrorCode.QUOTA_EXCEEDED,
      params: {
        metric: PlatformUsageMetric.ACTIVE_FLOWS,
        message: `Your ${plan.name} plan allows ${limit} ${planKey} per month. You've used ${used}.`,
        usage: used,
        limit,
      },
    })
  }
}
