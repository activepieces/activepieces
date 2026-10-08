import { apId } from '@activepieces/core-utils'
import { McpServerType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../../helpers/db'
import { McpClient, mcpClientHelpers } from '../../../helpers/mcp-client'
import { createMockProject } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const { mockTrackBilling } = vi.hoisted(() => ({
    mockTrackBilling: vi.fn<(params: TrackedBilling) => Promise<void>>(),
}))

vi.mock('../../../../src/app/platform/billing-and-telemetry', () => ({
    trackBillingAndSendTelemetry: mockTrackBilling,
}))

let app: FastifyInstance

const SWITCHED_OFF_TOOL = 'ap_run_action'
const FREE_TOOL = 'ap_create_flow'

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(() => {
    mockTrackBilling.mockReset()
    mockTrackBilling.mockResolvedValue(undefined)
})

function connectAs({ ctx }: { ctx: TestContext }): Promise<McpClient> {
    return mcpClientHelpers.connect({
        app,
        approve: (payload) => ctx.post('/v1/mcp-oauth/approve', payload),
    })
}

function call({ mcpClient, name, args }: { mcpClient: McpClient, name: string, args?: Record<string, unknown> }): Promise<string> {
    return mcpClientHelpers.callTool({ app, mcpClient, name, args })
}

function chargedProjectIds({ toolName }: { toolName: string }): (string | null)[] {
    return mockTrackBilling.mock.calls
        .map(([params]) => params.credits.properties)
        .filter((properties) => properties.toolName === toolName)
        .map((properties) => properties.projectId)
}

async function createRestrictedProject({ ctx }: { ctx: TestContext }): Promise<string> {
    const project = createMockProject({
        platformId: ctx.platform.id,
        ownerId: ctx.user.id,
        displayName: `project-${apId()}`,
    })
    await db.save('project', project)
    await db.save('mcp_server', {
        id: apId(),
        projectId: project.id,
        platformId: null,
        type: McpServerType.PROJECT,
        token: apId(72),
        disabledTools: [SWITCHED_OFF_TOOL],
    })
    return project.id
}

describe('MCP tool billing per project', () => {
    it('does not charge a billable tool the selected project switched off', async () => {
        const ctx = await createTestContext(app)
        const restrictedProjectId = await createRestrictedProject({ ctx })
        const mcpClient = await connectAs({ ctx })

        await call({ mcpClient, name: 'ap_set_project_context', args: { projectId: restrictedProjectId } })
        const refused = await call({ mcpClient, name: SWITCHED_OFF_TOOL, args: { pieceName: 'slack', actionName: 'send_channel_message' } })

        expect(refused).toContain('switched off')
        expect(chargedProjectIds({ toolName: SWITCHED_OFF_TOOL })).not.toContain(restrictedProjectId)
    })

    it('does not charge a free tool where it is on', async () => {
        const ctx = await createTestContext(app)
        const mcpClient = await connectAs({ ctx })

        await call({ mcpClient, name: 'ap_set_project_context', args: { projectId: ctx.project.id } })
        const created = await call({ mcpClient, name: FREE_TOOL, args: { flowName: 'allowed-flow' } })

        expect(created).not.toContain('switched off')
        expect(mockTrackBilling).not.toHaveBeenCalled()
    })
})

type TrackedBilling = {
    credits: {
        properties: {
            toolName: string
            projectId: string | null
        }
    }
}
