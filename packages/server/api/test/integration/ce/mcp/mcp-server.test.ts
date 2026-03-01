import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { McpServerStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { createTestContext } from '../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('MCP Server API', () => {
    describe('GET / (Get MCP Server)', () => {
        it('should return the MCP server for the project (auto-created)', async () => {
            const ctx = await createTestContext(app!)
            const response = await ctx.get(`/v1/projects/${ctx.project.id}/mcp-server`)
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.projectId).toBe(ctx.project.id)
            expect(body.token).toBeDefined()
            expect(body.status).toBeDefined()
        })

        it('should return same server on subsequent calls', async () => {
            const ctx = await createTestContext(app!)
            const response1 = await ctx.get(`/v1/projects/${ctx.project.id}/mcp-server`)
            const response2 = await ctx.get(`/v1/projects/${ctx.project.id}/mcp-server`)
            expect(response1.json().id).toBe(response2.json().id)
        })
    })

    describe('POST / (Update MCP Server)', () => {
        it('should update MCP server status to ENABLED', async () => {
            const ctx = await createTestContext(app!)
            // Ensure server exists
            await ctx.get(`/v1/projects/${ctx.project.id}/mcp-server`)

            const response = await ctx.post(`/v1/projects/${ctx.project.id}/mcp-server`, {
                status: McpServerStatus.ENABLED,
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().status).toBe(McpServerStatus.ENABLED)
        })

        it('should update MCP server status to DISABLED', async () => {
            const ctx = await createTestContext(app!)
            await ctx.get(`/v1/projects/${ctx.project.id}/mcp-server`)

            const response = await ctx.post(`/v1/projects/${ctx.project.id}/mcp-server`, {
                status: McpServerStatus.DISABLED,
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().status).toBe(McpServerStatus.DISABLED)
        })
    })

    describe('POST /rotate (Rotate Token)', () => {
        it('should rotate the MCP server token', async () => {
            const ctx = await createTestContext(app!)
            const getResponse = await ctx.get(`/v1/projects/${ctx.project.id}/mcp-server`)
            const originalToken = getResponse.json().token

            const rotateResponse = await ctx.post(`/v1/projects/${ctx.project.id}/mcp-server/rotate`)
            expect(rotateResponse.statusCode).toBe(StatusCodes.OK)
            expect(rotateResponse.json().token).not.toBe(originalToken)
        })
    })

    describe('POST /http (Streamable HTTP - Public)', () => {
        it('should reject requests with no auth header', async () => {
            const ctx = await createTestContext(app!)
            // Ensure server exists
            await ctx.get(`/v1/projects/${ctx.project.id}/mcp-server`)

            const response = await app!.inject({
                method: 'POST',
                url: `/v1/projects/${ctx.project.id}/mcp-server/http`,
                headers: {},
                body: {},
            })
            expect(response.statusCode).toBe(StatusCodes.UNAUTHORIZED)
        })

        it('should reject requests with wrong Bearer token', async () => {
            const ctx = await createTestContext(app!)
            await ctx.get(`/v1/projects/${ctx.project.id}/mcp-server`)

            const response = await app!.inject({
                method: 'POST',
                url: `/v1/projects/${ctx.project.id}/mcp-server/http`,
                headers: {
                    authorization: 'Bearer wrong-token',
                },
                body: {},
            })
            expect(response.statusCode).toBe(StatusCodes.UNAUTHORIZED)
        })
    })
})
