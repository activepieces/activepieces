import { apId } from '@activepieces/core-utils'
import { DefaultProjectRole, PlatformRole } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { mcpActivityRetention } from '../../../../src/app/mcp/activity/mcp-activity-retention'
import { db } from '../../../helpers/db'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let ctx: TestContext

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

async function recordActivity({ userId, projectId, platformId, status = 'SUCCEEDED', clientKey = null, created = new Date().toISOString() }: {
    userId: string
    projectId: string | null
    platformId?: string
    status?: string
    clientKey?: string | null
    created?: string
}): Promise<string> {
    const id = apId()
    await db.save('mcp_activity', {
        id,
        platformId: platformId ?? ctx.platform.id,
        projectId,
        userId,
        clientKey,
        toolName: 'ap_run_action',
        status,
        pieceName: '@activepieces/piece-slack',
        actionName: 'send_channel_message',
        connectionExternalId: 'conn-external-1',
        errorMessage: status === 'FAILED' ? 'Something broke' : null,
        durationMs: 42,
        payloadFileId: null,
        payloadTruncated: false,
        created,
        updated: created,
    })
    return id
}

async function promoteToOperator(memberCtx: TestContext): Promise<void> {
    await db.update('user', memberCtx.user.id, { platformRole: PlatformRole.OPERATOR })
}

describe('MCP activity', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment()
    })

    beforeEach(async () => {
        ctx = await createTestContext(app!)
    })

    describe('GET /v1/mcp-activity scope', () => {
        it('lists every members activity on the platform for a platform admin', async () => {
            const other = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.ADMIN })
            const mine = await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id })
            const theirs = await recordActivity({ userId: other.user.id, projectId: ctx.project.id })

            const response = await ctx.get('/v1/mcp-activity')

            expect(response.statusCode).toBe(200)
            const { data } = response.json()
            expect(data.map((row: { id: string }) => row.id).sort()).toEqual([mine, theirs].sort())
        })

        it('lists every members activity for a platform operator', async () => {
            const operator = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.VIEWER })
            await promoteToOperator(operator)
            const mine = await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id })
            const theirs = await recordActivity({ userId: operator.user.id, projectId: ctx.project.id })

            const response = await operator.get('/v1/mcp-activity')

            expect(response.statusCode).toBe(200)
            const { data } = response.json()
            expect(data.map((row: { id: string }) => row.id).sort()).toEqual([mine, theirs].sort())
        })

        it('narrows an unprivileged member to their own activity', async () => {
            const member = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.ADMIN })
            await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id })
            const theirs = await recordActivity({ userId: member.user.id, projectId: ctx.project.id })

            const response = await member.get('/v1/mcp-activity')

            expect(response.statusCode).toBe(200)
            const { data } = response.json()
            expect(data.map((row: { id: string }) => row.id)).toEqual([theirs])
        })

        it('never leaks activity from another platform', async () => {
            const otherPlatform = await createTestContext(app!)
            await recordActivity({ userId: otherPlatform.user.id, projectId: otherPlatform.project.id, platformId: otherPlatform.platform.id })
            const mine = await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id })

            const response = await ctx.get('/v1/mcp-activity')

            const { data } = response.json()
            expect(data.map((row: { id: string }) => row.id)).toEqual([mine])
        })
    })

    describe('GET /v1/mcp-activity filters', () => {
        it('filters by status', async () => {
            await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id, status: 'SUCCEEDED' })
            const failed = await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id, status: 'FAILED' })

            const response = await ctx.get('/v1/mcp-activity?statuses=FAILED')

            const { data } = response.json()
            expect(data.map((row: { id: string }) => row.id)).toEqual([failed])
        })

        it('filters by member', async () => {
            const other = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.ADMIN })
            await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id })
            const theirs = await recordActivity({ userId: other.user.id, projectId: ctx.project.id })

            const response = await ctx.get(`/v1/mcp-activity?memberIds=${other.user.id}`)

            const { data } = response.json()
            expect(data.map((row: { id: string }) => row.id)).toEqual([theirs])
        })

        it('filters by client', async () => {
            await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id, clientKey: 'cursor' })
            const fromClaudeCode = await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id, clientKey: 'claude-code' })

            const response = await ctx.get('/v1/mcp-activity?clientKeys=claude-code')

            const { data } = response.json()
            expect(data.map((row: { id: string }) => row.id)).toEqual([fromClaudeCode])
        })

        it('reads a row written before the client was known as an unknown client', async () => {
            const beforeTheColumn = await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id, clientKey: null })

            const response = await ctx.get('/v1/mcp-activity')

            const { data } = response.json()
            expect(data.find((row: { id: string }) => row.id === beforeTheColumn).clientKey).toBe('unknown')
        })

        it('matches a row with no recorded client on the unknown client filter', async () => {
            const beforeTheColumn = await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id, clientKey: null })
            await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id, clientKey: 'cursor' })

            const response = await ctx.get('/v1/mcp-activity?clientKeys=unknown')

            const { data } = response.json()
            expect(data.map((row: { id: string }) => row.id)).toEqual([beforeTheColumn])
        })

        it('filters by created window', async () => {
            const old = await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id, created: daysAgo(10) })
            const recent = await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id, created: daysAgo(1) })

            const response = await ctx.get(`/v1/mcp-activity?createdAfter=${encodeURIComponent(daysAgo(7))}`)

            const { data } = response.json()
            expect(data.map((row: { id: string }) => row.id)).toEqual([recent])
            expect(data.map((row: { id: string }) => row.id)).not.toContain(old)
        })

        it('matches platform-server activity on the platform-wide project filter', async () => {
            const scoped = await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id })
            const platformWide = await recordActivity({ userId: ctx.user.id, projectId: null })

            const platformWideOnly = await ctx.get('/v1/mcp-activity?projectIds=platform-wide')
            expect(platformWideOnly.json().data.map((row: { id: string }) => row.id)).toEqual([platformWide])

            const scopedOnly = await ctx.get(`/v1/mcp-activity?projectIds=${ctx.project.id}`)
            expect(scopedOnly.json().data.map((row: { id: string }) => row.id)).toEqual([scoped])
        })
    })

    describe('GET /v1/mcp-activity pagination', () => {
        it('pages newest first and follows the cursor', async () => {
            const oldest = await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id, created: daysAgo(3) })
            const middle = await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id, created: daysAgo(2) })
            const newest = await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id, created: daysAgo(1) })

            const first = await ctx.get('/v1/mcp-activity?limit=2')
            const firstPage = first.json()
            expect(firstPage.data.map((row: { id: string }) => row.id)).toEqual([newest, middle])

            const second = await ctx.get(`/v1/mcp-activity?limit=2&cursor=${encodeURIComponent(firstPage.next)}`)
            expect(second.json().data.map((row: { id: string }) => row.id)).toEqual([oldest])
        })
    })

    describe('GET /v1/mcp-activity/:id/payload', () => {
        it('404s when the activity stored no payload', async () => {
            const id = await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id })

            const response = await ctx.get(`/v1/mcp-activity/${id}/payload`)

            expect(response.statusCode).toBe(404)
        })

        it('404s on another members activity for an unprivileged member', async () => {
            const member = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.ADMIN })
            const mine = await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id })

            const response = await member.get(`/v1/mcp-activity/${mine}/payload`)

            expect(response.statusCode).toBe(404)
        })
    })

    describe('retention', () => {
        it('deletes activity past the retention boundary and spares what is inside it', async () => {
            const stale = await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id, created: daysAgo(45) })
            const fresh = await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id, created: daysAgo(1) })

            await mcpActivityRetention(app!.log).deleteStale()

            const response = await ctx.get('/v1/mcp-activity')
            const ids = response.json().data.map((row: { id: string }) => row.id)
            expect(ids).toContain(fresh)
            expect(ids).not.toContain(stale)
        })

        it('honours a projects shorter retention window', async () => {
            const previousPausedFlowTimeout = process.env.AP_PAUSED_FLOW_TIMEOUT_DAYS
            process.env.AP_PAUSED_FLOW_TIMEOUT_DAYS = '2'
            try {
                await db.update('project', ctx.project.id, { executionDataRetentionDays: 3 })
                const stale = await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id, created: daysAgo(5) })
                const fresh = await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id, created: daysAgo(1) })

                await mcpActivityRetention(app!.log).deleteStale()

                const response = await ctx.get('/v1/mcp-activity')
                const ids = response.json().data.map((row: { id: string }) => row.id)
                expect(ids).toContain(fresh)
                expect(ids).not.toContain(stale)
            }
            finally {
                if (previousPausedFlowTimeout === undefined) {
                    delete process.env.AP_PAUSED_FLOW_TIMEOUT_DAYS
                }
                else {
                    process.env.AP_PAUSED_FLOW_TIMEOUT_DAYS = previousPausedFlowTimeout
                }
            }
        })

        // getEffectiveExecutionDataRetentionDays floors a project's window at AP_PAUSED_FLOW_TIMEOUT_DAYS,
        // so with both defaults at 30 a shorter per-project setting deletes nothing earlier.
        it('floors a projects window at the paused-flow timeout', async () => {
            await db.update('project', ctx.project.id, { executionDataRetentionDays: 3 })
            const insideTheFloor = await recordActivity({ userId: ctx.user.id, projectId: ctx.project.id, created: daysAgo(5) })

            await mcpActivityRetention(app!.log).deleteStale()

            const response = await ctx.get('/v1/mcp-activity')
            expect(response.json().data.map((row: { id: string }) => row.id)).toContain(insideTheFloor)
        })
    })
})
