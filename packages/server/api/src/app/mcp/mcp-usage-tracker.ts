import { apId, isNil, tryCatch } from '@activepieces/core-utils'
import { isAppSumoCreditedPlan, PopulatedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { platformPlanService } from '../ee/platform/platform-plan/platform-plan.service'
import { trackBillingAndSendTelemetry } from '../platform/billing-and-telemetry'
import { CreditUsageSource, McpCallCreditConsumptionProperties } from '../platform/billing-provider'
import { projectService } from '../project/project-service'
import { mcpClients } from './mcp-clients'

export const mcpUsageTracker = (log: FastifyBaseLogger) => ({
    async resolveCallCharger({ mcp, clientId }: ResolveCallChargerParams): Promise<McpCallCharger> {
        if (!mcpClients.isExternalClient({ clientId })) {
            return () => undefined
        }
        const platformId = await resolvePlatformId({ mcp, log })
        if (isNil(platformId)) {
            log.warn({ mcp: { id: mcp.id } }, '[mcpUsageTracker] Could not tell which platform an MCP server belongs to, so its calls are not billed')
            return () => undefined
        }
        return ({ toolName, projectId }) => {
            void chargeCall({ platformId, projectId, toolName, clientId, log })
        }
    },
})

async function resolvePlatformId({ mcp, log }: { mcp: PopulatedMcpServer, log: FastifyBaseLogger }): Promise<string | null> {
    if (!isNil(mcp.platformId)) {
        return mcp.platformId
    }
    const { projectId } = mcp
    if (isNil(projectId)) {
        return null
    }
    const { data: project } = await tryCatch(() => projectService(log).getOneOrThrow(projectId))
    return project?.platformId ?? null
}

async function chargeCall({ platformId, projectId, toolName, clientId, log }: ChargeCallParams): Promise<void> {
    const { error } = await tryCatch(async () => {
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        const properties: McpCallCreditConsumptionProperties = { platformId, projectId, toolName, clientId }
        const usage = {
            platformId,
            value: MCP_CALL_CREDITS,
            source: CreditUsageSource.MCP as const,
            idempotencyKey: `mcp:${apId()}`,
            properties,
        }
        await trackBillingAndSendTelemetry({
            log,
            licenseKey: platformPlan.licenseKey,
            credits: usage,
            ...(isAppSumoCreditedPlan(platformPlan.plan) ? { appSumo: { ...usage, idempotencyKey: `mcpAppSumo:${apId()}` } } : {}),
        })
    })
    if (!isNil(error)) {
        log.warn({ error, platform: { id: platformId }, tool: { name: toolName } }, '[mcpUsageTracker] An MCP call was not billed')
    }
}

export const MCP_CALL_CREDITS = 1

export type McpCallCharger = (params: { toolName: string, projectId: string | null }) => void

type ResolveCallChargerParams = {
    mcp: PopulatedMcpServer
    clientId: string
}

type ChargeCallParams = {
    platformId: string
    projectId: string | null
    toolName: string
    clientId: string
    log: FastifyBaseLogger
}
