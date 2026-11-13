import { FastifyInstance } from 'fastify'
import { beforeAll, describe, expect, it } from 'vitest'
import { mcpOAuthTestHelpers } from '../../../helpers/mcp-oauth'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let ctx: TestContext

describe('MCP OAuth approve matches the requested resource', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment()
        ctx = await createTestContext(app)
    })

    it.each([
        { resource: 'http://localhost:4200/mcp/platform', withProject: false, approved: true },
        { resource: 'http://localhost:4200/mcp/platform/', withProject: false, approved: true },
        { resource: 'http://localhost:4200/mcp/platform', withProject: true, approved: false },
        { resource: 'http://localhost:4200/mcp', withProject: true, approved: true },
        { resource: 'http://localhost:4200/mcp', withProject: false, approved: false },
        { resource: undefined, withProject: true, approved: true },
        { resource: undefined, withProject: false, approved: false },
    ])('resource $resource with project=$withProject is approved: $approved', async ({ resource, withProject, approved }) => {
        const authRequestId = await mcpOAuthTestHelpers.authorize({ app, resource })

        const res = await ctx.post('/v1/mcp-oauth/approve', {
            authRequestId,
            ...(withProject ? { projectId: ctx.project.id } : {}),
        })

        expect(res.statusCode).toBe(approved ? 200 : 400)
    })
})
