import { ActivepiecesError, apId, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { isAppSumoCreditedPlan, McpToolResult, PopulatedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { platformPlanService } from '../ee/platform/platform-plan/platform-plan.service'
import { trackBillingAndSendTelemetry } from '../platform/billing-and-telemetry'
import { assertCreditsAndAppSumoNotExceeded, CreditUsageSource, McpCallCreditConsumptionProperties } from '../platform/billing-provider'
import { projectService } from '../project/project-service'
import { mcpClients } from './mcp-clients'

export const mcpUsageTracker = (log: FastifyBaseLogger) => ({
    async resolveCallBilling({ mcp, clientId }: ResolveCallBillingParams): Promise<McpCallBilling> {
        if (!mcpClients.isExternalClient({ clientId })) {
            return EXEMPT_FROM_BILLING
        }
        const platformId = await resolvePlatformId({ mcp, log })
        if (isNil(platformId)) {
            log.warn({ mcp: { id: mcp.id } }, '[mcpUsageTracker] Could not tell which platform an MCP server belongs to, so its calls are neither gated nor billed')
            return EXEMPT_FROM_BILLING
        }
        return {
            refusalWhenOutOfCredits: ({ toolName }) => refusalWhenOutOfCredits({ platformId, toolName, log }),
            charge: ({ toolName, projectId }) => {
                void chargeCall({ platformId, projectId, toolName, clientId, log })
            },
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

// A credits lookup that fails for its own reasons must not take the tool down with it, so anything
// that is not a definite "out of credits" lets the call through, as the chat personalization path does.
async function refusalWhenOutOfCredits({ platformId, toolName, log }: RefusalParams): Promise<McpToolResult | null> {
    const { error } = await tryCatch(() => assertCreditsAndAppSumoNotExceeded({ platformId, log }))
    if (isNil(error)) {
        return null
    }
    const exhausted = error instanceof ActivepiecesError && error.error.code === ErrorCode.QUOTA_EXCEEDED
    if (!exhausted) {
        log.warn({ error, platform: { id: platformId }, tool: { name: toolName } }, '[mcpUsageTracker] Credits check failed, allowing the call')
        return null
    }
    return {
        content: [{ type: 'text', text: `❌ Out of credits: this platform has used all of its Activepieces credits, so "${toolName}" cannot run. Add credits or upgrade the plan, then try again.` }],
        isError: true,
    }
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

const EXEMPT_FROM_BILLING: McpCallBilling = {
    refusalWhenOutOfCredits: async () => null,
    charge: () => undefined,
}

export const MCP_CALL_CREDITS = 1

export type McpCallBilling = {
    refusalWhenOutOfCredits: (params: { toolName: string }) => Promise<McpToolResult | null>
    charge: (params: { toolName: string, projectId: string | null }) => void
}

type ResolveCallBillingParams = {
    mcp: PopulatedMcpServer
    clientId: string
}

type RefusalParams = {
    platformId: string
    toolName: string
    log: FastifyBaseLogger
}

type ChargeCallParams = {
    platformId: string
    projectId: string | null
    toolName: string
    clientId: string
    log: FastifyBaseLogger
}
