import { isNil } from '@activepieces/core-utils'
import { OPEN_SOURCE_PLAN, PlatformPlanLimits, PlatformPlanWithOnlyLimits, PrincipalType, STANDARD_CLOUD_PLAN, TeamProjectsLimit } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { platformAiCreditsService } from '../platform/platform-plan/platform-ai-credits.service'
import { platformPlanService } from '../platform/platform-plan/platform-plan.service'

export const devToolsController: FastifyPluginAsyncZod = async (fastify) => {

    fastify.post('/plan', SetPlanRequest, async (request) => {
        const platformId = request.principal.platform.id
        await platformPlanService(request.log).getOrCreateForPlatform(platformId)
        return platformPlanService(request.log).update({ platformId, ...request.body })
    })

    fastify.post('/plan/preset', ApplyPresetRequest, async (request) => {
        const platformId = request.principal.platform.id
        await platformPlanService(request.log).getOrCreateForPlatform(platformId)
        return platformPlanService(request.log).update({ platformId, ...PLAN_PRESETS[request.body.preset] })
    })

    fastify.post('/credits', SetCreditsRequest, async (request) => {
        const platformId = request.principal.platform.id
        const { includedAiCredits, drainToZero } = request.body
        await platformPlanService(request.log).getOrCreateForPlatform(platformId)

        const targetCredits = drainToZero ? 0 : includedAiCredits
        if (!isNil(targetCredits)) {
            await platformPlanService(request.log).update({ platformId, includedAiCredits: targetCredits })
            await platformAiCreditsService(request.log).devOverrideUsageRemaining({ platformId, creditsRemaining: targetCredits })
        }

        return platformPlanService(request.log).getOrCreateForPlatform(platformId)
    })
}

const DevToolsPlanPreset = z.enum(['OPEN_SOURCE', 'STANDARD_CLOUD', 'ENTERPRISE'])

const ENTERPRISE_PLAN: PlatformPlanWithOnlyLimits = {
    ...OPEN_SOURCE_PLAN,
    plan: 'enterprise',
    tablesEnabled: true,
    eventStreamingEnabled: true,
    embeddingEnabled: true,
    agentsEnabled: true,
    aiProvidersEnabled: true,
    chatEnabled: true,
    dataManipulationEnabled: true,
    globalConnectionsEnabled: true,
    customRolesEnabled: true,
    environmentsEnabled: true,
    analyticsEnabled: true,
    auditLogEnabled: true,
    managePiecesEnabled: true,
    manageTemplatesEnabled: true,
    customAppearanceEnabled: true,
    projectRolesEnabled: true,
    apiKeysEnabled: true,
    ssoEnabled: true,
    secretManagersEnabled: true,
    scimEnabled: true,
    showPoweredBy: false,
    teamProjectsLimit: TeamProjectsLimit.UNLIMITED,
    includedAiCredits: 100_000,
    activeFlowsLimit: null,
    projectsLimit: null,
}

const PLAN_PRESETS: Record<z.infer<typeof DevToolsPlanPreset>, PlatformPlanWithOnlyLimits> = {
    OPEN_SOURCE: OPEN_SOURCE_PLAN,
    STANDARD_CLOUD: STANDARD_CLOUD_PLAN,
    ENTERPRISE: ENTERPRISE_PLAN,
}

const SetPlanRequest = {
    schema: {
        body: PlatformPlanLimits.partial(),
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
}

const ApplyPresetRequest = {
    schema: {
        body: z.object({ preset: DevToolsPlanPreset }),
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
}

const SetCreditsRequest = {
    schema: {
        body: z.object({
            includedAiCredits: z.number().optional(),
            drainToZero: z.boolean().optional(),
        }),
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
}
