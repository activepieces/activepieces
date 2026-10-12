import { ActivepiecesError, apId, ErrorCode, Permission, PlatformUsageMetric, RoleType } from '@activepieces/core-utils'
import { DefaultProjectRole } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../../helpers/db'
import { McpClient, mcpClientHelpers } from '../../../helpers/mcp-client'
import { createMockProjectRole } from '../../../helpers/mocks'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const { mockAssertCredits } = vi.hoisted(() => ({
    mockAssertCredits: vi.fn(),
}))

vi.mock('../../../../src/app/platform/billing-provider', async (importOriginal) => {
    const original = await importOriginal<typeof import('../../../../src/app/platform/billing-provider')>()
    return { ...original, assertCreditsAndAppSumoNotExceeded: mockAssertCredits }
})

let app: FastifyInstance

const SET_PROJECT_CONTEXT = 'ap_set_project_context'
const PIECE_CATALOG_TOOL = 'ap_research_pieces'
const RUN_ACTION = 'ap_run_action'

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(() => {
    mockAssertCredits.mockReset()
    mockAssertCredits.mockRejectedValue(new ActivepiecesError({
        code: ErrorCode.QUOTA_EXCEEDED,
        params: { metric: PlatformUsageMetric.AI_CREDITS },
    }))
})

function connectAs({ ctx }: { ctx: TestContext }): Promise<McpClient> {
    return mcpClientHelpers.connect({
        app,
        approve: (payload) => ctx.post('/v1/mcp-oauth/approve', payload),
    })
}

function call({ mcpClient, name }: { mcpClient: McpClient, name: string }): Promise<string> {
    return mcpClientHelpers.callTool({ app, mcpClient, name })
}

describe('a denied MCP call is refused before the platform is charged', () => {
    it('refuses ap_set_project_context on reach, not on credits', async () => {
        const ctx = await createTestContext(app)
        const { member, role } = await createCustomRoleMember({ ctx })
        const mcpClient = await connectAs({ ctx: member })

        await db.update('project_role', role.id, { permissions: [Permission.READ_FLOW] })

        const answer = await call({ mcpClient, name: SET_PROJECT_CONTEXT })

        expect(answer).toContain(Permission.READ_MCP)
        expect(answer).not.toContain('Out of credits')
    })

    it('refuses a piece-catalog tool on reach, not on credits', async () => {
        const ctx = await createTestContext(app)
        const { member, role } = await createCustomRoleMember({ ctx })
        const mcpClient = await connectAs({ ctx: member })

        await db.update('project_role', role.id, { permissions: [Permission.READ_FLOW] })

        const answer = await call({ mcpClient, name: PIECE_CATALOG_TOOL })

        expect(answer).toContain(Permission.READ_MCP)
        expect(answer).not.toContain('Out of credits')
    })

    it('lets a member with reach use a free tool when credits run out', async () => {
        const ctx = await createTestContext(app)
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.EDITOR })
        const mcpClient = await connectAs({ ctx: member })

        const answer = await call({ mcpClient, name: SET_PROJECT_CONTEXT })

        expect(answer).toContain('Available projects')
        expect(answer).not.toContain('Out of credits')
    })

    it('still refuses ap_run_action for a member with reach on credits', async () => {
        const ctx = await createTestContext(app)
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.EDITOR })
        const mcpClient = await connectAs({ ctx: member })
        await mcpClientHelpers.callTool({ app, mcpClient, name: SET_PROJECT_CONTEXT, args: { projectId: ctx.project.id } })

        const answer = await mcpClientHelpers.callTool({ app, mcpClient, name: RUN_ACTION, args: { pieceName: 'slack', actionName: 'send_channel_message' } })

        expect(answer).toContain('Out of credits')
    })
})

async function createCustomRoleMember({ ctx }: { ctx: TestContext }) {
    const role = createMockProjectRole({
        platformId: ctx.platform.id,
        name: `role-${apId()}`,
        permissions: [Permission.READ_FLOW, Permission.READ_MCP],
        type: RoleType.CUSTOM,
    })
    await db.save('project_role', role)
    const member = await createMemberContext(app, ctx, { projectRole: role.name })
    return { member, role }
}
