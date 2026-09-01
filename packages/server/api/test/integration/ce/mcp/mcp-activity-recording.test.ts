import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { McpActivity, McpOAuthClientKey } from '@activepieces/shared'
import { createMockConnection } from '../../../helpers/mocks'
import { FastifyInstance } from 'fastify'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { withActivityRecording } from '../../../../src/app/mcp/activity/mcp-activity-recorder'
import { mcpServerService } from '../../../../src/app/mcp/mcp-service'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let ctx: TestContext

const RECORD_SETTLE_MS = 1500

async function callProjectTool({ name, args, clientKey = null }: { name: string, args: Record<string, unknown>, clientKey?: McpOAuthClientKey | null }): Promise<void> {
    const mcp = await mcpServerService(app!.log).getPopulatedByProjectId(ctx.project.id)
    const server = await mcpServerService(app!.log).buildServer({
        mcp,
        userId: ctx.user.id,
        platformId: ctx.platform.id,
        clientKey,
    })

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    const client = new Client({ name: 'activity-test', version: '1.0.0' })
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
    await client.callTool({ name, arguments: args })
    await new Promise((resolve) => setTimeout(resolve, RECORD_SETTLE_MS))
    await client.close()
}

async function callRunAction({ pieceName, connectionExternalId, clientKey }: { pieceName?: string, connectionExternalId?: string, clientKey?: McpOAuthClientKey | null }): Promise<void> {
    await callProjectTool({
        name: 'ap_run_action',
        args: {
            pieceName: pieceName ?? 'doesnotexist',
            actionName: 'do_nothing',
            ...(connectionExternalId === undefined ? {} : { connectionExternalId }),
        },
        clientKey: clientKey ?? null,
    })
}

async function findActivityRows(): Promise<McpActivity[]> {
    return databaseConnection()
        .getRepository('mcp_activity')
        .find({ where: { platformId: ctx.platform.id } }) as Promise<McpActivity[]>
}

describe('MCP activity recording', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment()
    })

    beforeEach(async () => {
        ctx = await createTestContext(app!)
    })

    // The project MCP server is the main path and it recorded nothing, because
    // mcp_server.platformId is NULL on every PROJECT row. Drive a real tool call
    // rather than inserting a row, or this comes back.
    it('records a tool call made against a project MCP server', async () => {
        await callRunAction({ connectionExternalId: 'conn-external-1' })

        const rows = await findActivityRows()
        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({
            platformId: ctx.platform.id,
            projectId: ctx.project.id,
            userId: ctx.user.id,
            toolName: 'ap_run_action',
            pieceName: '@activepieces/piece-doesnotexist',
            actionName: 'do_nothing',
            connectionExternalId: 'conn-external-1',
        })
        expect(rows[0].payloadFileId).not.toBeNull()
    })

    // The client is only knowable from the access token that authenticated the call,
    // so it has to survive buildServer -> the activity context -> the row.
    it('names the client that made the call', async () => {
        await callRunAction({ connectionExternalId: 'conn-external-1', clientKey: 'claude-code' })

        const rows = await findActivityRows()
        expect(rows[0].clientKey).toBe('claude-code')
    })

    it('leaves the client null when the token carried none', async () => {
        await callRunAction({ connectionExternalId: 'conn-external-1' })

        const rows = await findActivityRows()
        expect(rows[0].clientKey).toBeNull()
    })

    // The SDK validates tools/call against inputSchema before execute runs, so a
    // schema-invalid call never reaches the recorder and writes no row.
    it('writes no row when the arguments fail schema validation', async () => {
        await callProjectTool({ name: 'ap_run_action', args: { pieceName: 42, actionName: 'do_nothing' } })

        expect(await findActivityRows()).toHaveLength(0)
    })

    it('serves the recorded payload back', async () => {
        await callRunAction({ connectionExternalId: 'conn-external-1' })
        const [activity] = await findActivityRows()

        const response = await ctx.get(`/v1/mcp-activity/${activity.id}/payload`)

        expect(response.statusCode).toBe(200)
        const payload = response.json()
        expect(payload.input).toMatchObject({ pieceName: 'doesnotexist', connectionExternalId: 'conn-external-1' })
        expect(payload.truncated).toBe(false)
    })

    it('names the connection on the listed entry', async () => {
        const connection = createMockConnection({
            platformId: ctx.platform.id,
            projectIds: [ctx.project.id],
            displayName: 'Production Slack',
            externalId: 'conn-external-1',
        }, ctx.user.id)
        await databaseConnection().getRepository('app_connection').save(connection)

        await callRunAction({ connectionExternalId: 'conn-external-1' })

        const { data } = (await ctx.get('/v1/mcp-activity')).json()
        expect(data).toHaveLength(1)
        expect(data[0].connectionExternalId).toBe('conn-external-1')
        expect(data[0].connectionDisplayName).toBe('Production Slack')
        expect(data[0].hasPayload).toBe(true)
    })

    it('leaves the connection name null when nothing resolves', async () => {
        await callRunAction({ connectionExternalId: 'hallucinated-connection' })

        const { data } = (await ctx.get('/v1/mcp-activity')).json()
        expect(data[0].connectionExternalId).toBe('hallucinated-connection')
        expect(data[0].connectionDisplayName).toBeNull()
    })

    it('records no connection when the call carried none', async () => {
        await callRunAction({})

        const rows = await findActivityRows()
        expect(rows).toHaveLength(1)
        expect(rows[0].connectionExternalId).toBeNull()
    })

    // The names are model-written and land in varchar(256); a NUL byte or an
    // over-long name would abort the insert and lose the row silently.
    it('still writes the row when the arguments are hostile', async () => {
        await callRunAction({ pieceName: `does\u0000notexist${'x'.repeat(400)}`, connectionExternalId: 'c'.repeat(400) })

        const rows = await findActivityRows()
        expect(rows).toHaveLength(1)
        expect(rows[0].pieceName).not.toContain('\u0000')
        expect(rows[0].pieceName?.length).toBeLessThanOrEqual(256)
        expect(rows[0].connectionExternalId?.length).toBeLessThanOrEqual(256)
    })

    it('does not record a read-only tool', async () => {
        await callProjectTool({ name: 'ap_list_flows', args: {} })

        expect(await findActivityRows()).toHaveLength(0)
    })

    // Recording used to follow annotations.readOnlyHint === false, which covered 26 tools.
    // Only ap_run_action reaches a third-party system, so only it earns a row.
    it('does not record the mutating tools it used to', async () => {
        await callProjectTool({ name: 'ap_delete_flow', args: { flowId: 'doesnotexist000000000' } })
        await callProjectTool({ name: 'ap_create_flow', args: { flowName: 'built by mcp' } })

        expect(await findActivityRows()).toHaveLength(0)
    })

    // ap_run_action catches everything itself, but on the platform path the project
    // selection, the mcp lookup and the permission checker all resolve inside the
    // recorded closure. A throw there used to lose the call entirely.
    it('records a call whose execute threw, and still rethrows it', async () => {
        const thrown = new Error('project selection is unavailable')
        const recordedExecute = withActivityRecording({
            execute: () => Promise.reject(thrown),
            tool: { title: 'ap_run_action' },
            resolveContext: () => Promise.resolve({
                platformId: ctx.platform.id,
                projectId: ctx.project.id,
                userId: ctx.user.id,
                clientKey: null,
            }),
            log: app!.log,
        })

        await expect(recordedExecute({ pieceName: 'slack', actionName: 'send_channel_message' })).rejects.toBe(thrown)
        await new Promise((resolve) => setTimeout(resolve, RECORD_SETTLE_MS))

        const rows = await findActivityRows()
        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({
            status: 'FAILED',
            toolName: 'ap_run_action',
            pieceName: '@activepieces/piece-slack',
            actionName: 'send_channel_message',
        })
        expect(rows[0].errorMessage).toContain('project selection is unavailable')
        expect(rows[0].payloadFileId).not.toBeNull()
    })

    // The default retention pass filters on created with no projectId to narrow it,
    // and an unprivileged member's listing filters on userId under platformId.
    // Neither has a usable index without these two.
    it('indexes the retention sweep and the per-member listing', async () => {
        const indexes = await databaseConnection().query(
            'SELECT indexname FROM pg_indexes WHERE tablename = \'mcp_activity\'',
        )
        const names = indexes.map((index: { indexname: string }) => index.indexname)

        expect(names).toContain('idx_mcp_activity_created_id')
        expect(names).toContain('idx_mcp_activity_platform_id_user_id_created_id')
    })

    // Postgres runs the ON DELETE SET NULL action per deleted file row, so without
    // this index the hourly file cleanup pays a sequential scan of mcp_activity for
    // every file it deletes — measured at 671x on a 200k-row table.
    it('indexes payloadFileId so file cleanup does not scan', async () => {
        const indexes = await databaseConnection().query(
            'SELECT indexname FROM pg_indexes WHERE tablename = \'mcp_activity\'',
        )

        expect(indexes.map((index: { indexname: string }) => index.indexname))
            .toContain('idx_mcp_activity_payload_file_id')
    })
})
