import { ApplicationEvent, ApplicationEventName, FlowStatus } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { auditLogRepo } from '../../../../src/app/ee/audit-logs/audit-event-service'
import { apChangeFlowStatusTool } from '../../../../src/app/mcp/tools/ap-change-flow-status'
import { apLockAndPublishTool } from '../../../../src/app/mcp/tools/ap-lock-and-publish'
import { apRenameFlowTool } from '../../../../src/app/mcp/tools/ap-rename-flow'
import { mockMcpToolContext, seedPublishableFlow } from '../../../helpers/mcp-flow'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
    mockLog = app.log
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('MCP flow tools write audit log rows', () => {
    it('persists flow.published and flow.activated to the audit_event table', async () => {
        const ctx = await createTestContext(app, { plan: { auditLogEnabled: true } })
        const { flow } = await seedPublishableFlow({ ctx })

        await apLockAndPublishTool(mockMcpToolContext(ctx, ctx.user.id), mockLog).execute({ flowId: flow.id })

        const rows = await savedAuditRows(ctx, 3)
        expect(rows.map((row) => row.action)).toEqual([
            ApplicationEventName.FLOW_UPDATED,
            ApplicationEventName.FLOW_PUBLISHED,
            ApplicationEventName.FLOW_ACTIVATED,
        ])
    })

    it('records the acting user, project and platform on the persisted row', async () => {
        const ctx = await createTestContext(app, { plan: { auditLogEnabled: true } })
        const { flow } = await seedPublishableFlow({ ctx })

        await apLockAndPublishTool(mockMcpToolContext(ctx, ctx.user.id), mockLog).execute({ flowId: flow.id })

        const rows = await savedAuditRows(ctx, 3)
        const published = rows.find((row) => row.action === ApplicationEventName.FLOW_PUBLISHED)
        expect(published?.userId).toBe(ctx.user.id)
        expect(published?.userEmail).toBe(ctx.userIdentity.email)
        expect(published?.projectId).toBe(ctx.project.id)
        expect(published?.platformId).toBe(ctx.platform.id)
    })

    it('falls back to the project owner when the MCP server has no authenticated user', async () => {
        const ctx = await createTestContext(app, { plan: { auditLogEnabled: true } })
        const { flow } = await seedPublishableFlow({ ctx })

        await apRenameFlowTool(mockMcpToolContext(ctx), mockLog).execute({ flowId: flow.id, displayName: 'Renamed by an agent' })

        const [updated] = await savedAuditRows(ctx, 1)
        expect(updated.action).toBe(ApplicationEventName.FLOW_UPDATED)
        expect(updated.userId).toBe(ctx.project.ownerId)
    })

    it('persists flow.deactivated when an agent disables a published flow', async () => {
        const ctx = await createTestContext(app, { plan: { auditLogEnabled: true } })
        const { flow } = await seedPublishableFlow({ ctx, status: FlowStatus.ENABLED, publishCurrentVersion: true })

        await apChangeFlowStatusTool(mockMcpToolContext(ctx, ctx.user.id), mockLog).execute({ flowId: flow.id, status: FlowStatus.DISABLED })

        const rows = await savedAuditRows(ctx, 2)
        expect(rows.map((row) => row.action)).toEqual([
            ApplicationEventName.FLOW_UPDATED,
            ApplicationEventName.FLOW_DEACTIVATED,
        ])
    })

    it('writes no audit row for a read-only tool call', async () => {
        const ctx = await createTestContext(app, { plan: { auditLogEnabled: true } })
        await seedPublishableFlow({ ctx })

        await new Promise((resolve) => setTimeout(resolve, 300))

        expect(await auditLogRepo().countBy({ platformId: ctx.platform.id })).toBe(0)
    })
})

async function savedAuditRows(ctx: TestContext, expectedCount: number): Promise<ApplicationEvent[]> {
    await vi.waitUntil(
        async () => await auditLogRepo().countBy({ platformId: ctx.platform.id }) >= expectedCount,
        { timeout: 5000, interval: 50 },
    )
    return auditLogRepo().find({
        where: { platformId: ctx.platform.id },
        order: { created: 'ASC' },
    })
}
