import { apId } from '@activepieces/core-utils'
import { AdhocRun, AdhocRunKind, AdhocRunSource, FileCompression, FileType, FlowRunStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { fileService } from '../../../../src/app/file/file.service'
import { db } from '../../../helpers/db'
import { createMockConnection } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

function createMockAdhocRun(params: { projectId: string, platformId: string } & Partial<AdhocRun>): AdhocRun {
    const now = dayjs().toISOString()
    return {
        id: apId(),
        created: now,
        updated: now,
        projectId: params.projectId,
        platformId: params.platformId,
        userId: null,
        kind: AdhocRunKind.PIECE,
        pieceName: '@activepieces/piece-slack',
        pieceVersion: '0.1.0',
        actionName: 'send_channel_message',
        connectionExternalId: null,
        source: AdhocRunSource.MCP,
        status: FlowRunStatus.SUCCEEDED,
        input: { text: 'hi' },
        output: { ok: true },
        logs: null,
        errorMessage: null,
        startTime: now,
        finishTime: now,
        logsFileId: null,
        archivedAt: null,
        ...params,
    }
}

describe('Adhoc Run API', () => {
    describe('GET /v1/adhoc-runs (List)', () => {
        it('returns the project ad-hoc runs newest-first', async () => {
            const ctx = await createTestContext(app!)
            const older = createMockAdhocRun({ projectId: ctx.project.id, platformId: ctx.platform.id, created: dayjs().subtract(2, 'minute').toISOString(), actionName: 'older' })
            const newer = createMockAdhocRun({ projectId: ctx.project.id, platformId: ctx.platform.id, created: dayjs().toISOString(), actionName: 'newer' })
            await db.save('adhoc_run', older)
            await db.save('adhoc_run', newer)

            const response = await ctx.get('/v1/adhoc-runs', { projectId: ctx.project.id })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data).toHaveLength(2)
            expect(body.data[0].id).toBe(newer.id)
            expect(body.data[1].id).toBe(older.id)
        })

        it('paginates with a cursor', async () => {
            const ctx = await createTestContext(app!)
            for (let i = 0; i < 3; i++) {
                await db.save('adhoc_run', createMockAdhocRun({ projectId: ctx.project.id, platformId: ctx.platform.id, created: dayjs().add(i, 'second').toISOString() }))
            }

            const firstPage = await ctx.get('/v1/adhoc-runs', { projectId: ctx.project.id, limit: '2' })
            expect(firstPage?.statusCode).toBe(StatusCodes.OK)
            const firstBody = firstPage?.json()
            expect(firstBody.data).toHaveLength(2)
            expect(firstBody.next).toBeDefined()

            const secondPage = await ctx.get('/v1/adhoc-runs', { projectId: ctx.project.id, limit: '2', cursor: firstBody.next })
            expect(secondPage?.statusCode).toBe(StatusCodes.OK)
            expect(secondPage?.json().data).toHaveLength(1)
        })

        it('enriches runs with the connection display name and the user name', async () => {
            const ctx = await createTestContext(app!)
            const connection = createMockConnection({
                platformId: ctx.platform.id,
                projectIds: [ctx.project.id],
                displayName: 'My Slack',
            }, ctx.user.id)
            await db.save('app_connection', connection)
            const run = createMockAdhocRun({
                projectId: ctx.project.id,
                platformId: ctx.platform.id,
                userId: ctx.user.id,
                connectionExternalId: connection.externalId,
            })
            await db.save('adhoc_run', run)

            const response = await ctx.get('/v1/adhoc-runs', { projectId: ctx.project.id })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data).toHaveLength(1)
            expect(body.data[0].connectionDisplayName).toBe('My Slack')
            expect(body.data[0].userName).toBe(`${ctx.userIdentity.firstName} ${ctx.userIdentity.lastName}`.trim())
        })

        it('returns null enrichment when the connection and user are absent', async () => {
            const ctx = await createTestContext(app!)
            await db.save('adhoc_run', createMockAdhocRun({ projectId: ctx.project.id, platformId: ctx.platform.id }))

            const response = await ctx.get('/v1/adhoc-runs', { projectId: ctx.project.id })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data[0].connectionDisplayName).toBeNull()
            expect(body.data[0].userName).toBeNull()
        })

        it('does not leak runs from another project', async () => {
            const ctxA = await createTestContext(app!)
            const ctxB = await createTestContext(app!)
            await db.save('adhoc_run', createMockAdhocRun({ projectId: ctxB.project.id, platformId: ctxB.platform.id }))

            const response = await ctxA.get('/v1/adhoc-runs', { projectId: ctxA.project.id })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().data).toHaveLength(0)
        })

        it('filters by status', async () => {
            const ctx = await createTestContext(app!)
            const succeeded = createMockAdhocRun({ projectId: ctx.project.id, platformId: ctx.platform.id, status: FlowRunStatus.SUCCEEDED })
            const failed = createMockAdhocRun({ projectId: ctx.project.id, platformId: ctx.platform.id, status: FlowRunStatus.FAILED })
            await db.save('adhoc_run', succeeded)
            await db.save('adhoc_run', failed)

            const response = await ctx.get('/v1/adhoc-runs', { projectId: ctx.project.id, status: [FlowRunStatus.FAILED] })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data).toHaveLength(1)
            expect(body.data[0].id).toBe(failed.id)
        })

        it('filters by source', async () => {
            const ctx = await createTestContext(app!)
            const mcp = createMockAdhocRun({ projectId: ctx.project.id, platformId: ctx.platform.id, source: AdhocRunSource.MCP })
            const chat = createMockAdhocRun({ projectId: ctx.project.id, platformId: ctx.platform.id, source: AdhocRunSource.CHAT })
            await db.save('adhoc_run', mcp)
            await db.save('adhoc_run', chat)

            const response = await ctx.get('/v1/adhoc-runs', { projectId: ctx.project.id, source: [AdhocRunSource.CHAT] })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data).toHaveLength(1)
            expect(body.data[0].id).toBe(chat.id)
        })

        it('filters by created date range', async () => {
            const ctx = await createTestContext(app!)
            const old = createMockAdhocRun({ projectId: ctx.project.id, platformId: ctx.platform.id, created: dayjs().subtract(10, 'day').toISOString() })
            const recent = createMockAdhocRun({ projectId: ctx.project.id, platformId: ctx.platform.id, created: dayjs().toISOString() })
            await db.save('adhoc_run', old)
            await db.save('adhoc_run', recent)

            const response = await ctx.get('/v1/adhoc-runs', {
                projectId: ctx.project.id,
                createdAfter: dayjs().subtract(2, 'day').toISOString(),
                createdBefore: dayjs().add(1, 'day').toISOString(),
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data).toHaveLength(1)
            expect(body.data[0].id).toBe(recent.id)
        })

        it('excludes archived runs by default and includes them when requested', async () => {
            const ctx = await createTestContext(app!)
            const active = createMockAdhocRun({ projectId: ctx.project.id, platformId: ctx.platform.id })
            const archived = createMockAdhocRun({ projectId: ctx.project.id, platformId: ctx.platform.id, archivedAt: dayjs().toISOString() })
            await db.save('adhoc_run', active)
            await db.save('adhoc_run', archived)

            const defaultResponse = await ctx.get('/v1/adhoc-runs', { projectId: ctx.project.id })
            expect(defaultResponse?.statusCode).toBe(StatusCodes.OK)
            const defaultBody = defaultResponse?.json()
            expect(defaultBody.data).toHaveLength(1)
            expect(defaultBody.data[0].id).toBe(active.id)

            const includeResponse = await ctx.get('/v1/adhoc-runs', { projectId: ctx.project.id, includeArchived: 'true' })
            expect(includeResponse?.statusCode).toBe(StatusCodes.OK)
            expect(includeResponse?.json().data).toHaveLength(2)
        })
    })

    describe('POST /v1/adhoc-runs/archive (Archive)', () => {
        it('archives the selected runs', async () => {
            const ctx = await createTestContext(app!)
            const target = createMockAdhocRun({ projectId: ctx.project.id, platformId: ctx.platform.id })
            const other = createMockAdhocRun({ projectId: ctx.project.id, platformId: ctx.platform.id })
            await db.save('adhoc_run', target)
            await db.save('adhoc_run', other)

            const response = await ctx.post('/v1/adhoc-runs/archive', { projectId: ctx.project.id, adhocRunIds: [target.id] })
            expect(response?.statusCode).toBe(StatusCodes.OK)

            const list = await ctx.get('/v1/adhoc-runs', { projectId: ctx.project.id })
            const body = list?.json()
            expect(body.data).toHaveLength(1)
            expect(body.data[0].id).toBe(other.id)
        })

        it('archives all matching runs except the excluded ones', async () => {
            const ctx = await createTestContext(app!)
            const kept = createMockAdhocRun({ projectId: ctx.project.id, platformId: ctx.platform.id })
            const archivedA = createMockAdhocRun({ projectId: ctx.project.id, platformId: ctx.platform.id })
            const archivedB = createMockAdhocRun({ projectId: ctx.project.id, platformId: ctx.platform.id })
            await db.save('adhoc_run', kept)
            await db.save('adhoc_run', archivedA)
            await db.save('adhoc_run', archivedB)

            const response = await ctx.post('/v1/adhoc-runs/archive', { projectId: ctx.project.id, excludeAdhocRunIds: [kept.id] })
            expect(response?.statusCode).toBe(StatusCodes.OK)

            const list = await ctx.get('/v1/adhoc-runs', { projectId: ctx.project.id })
            const body = list?.json()
            expect(body.data).toHaveLength(1)
            expect(body.data[0].id).toBe(kept.id)
        })

        it('does not archive runs from another project', async () => {
            const ctxA = await createTestContext(app!)
            const ctxB = await createTestContext(app!)
            const runB = createMockAdhocRun({ projectId: ctxB.project.id, platformId: ctxB.platform.id })
            await db.save('adhoc_run', runB)

            const response = await ctxA.post('/v1/adhoc-runs/archive', { projectId: ctxA.project.id, adhocRunIds: [runB.id] })
            expect(response?.statusCode).toBe(StatusCodes.OK)

            const list = await ctxB.get('/v1/adhoc-runs', { projectId: ctxB.project.id })
            expect(list?.json().data).toHaveLength(1)
        })
    })

    describe('GET /v1/adhoc-runs/:id (Get)', () => {
        it('returns the ad-hoc run with its output', async () => {
            const ctx = await createTestContext(app!)
            const run = createMockAdhocRun({ projectId: ctx.project.id, platformId: ctx.platform.id, output: { value: 42 } })
            await db.save('adhoc_run', run)

            const response = await ctx.get(`/v1/adhoc-runs/${run.id}`)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.id).toBe(run.id)
            expect(body.status).toBe(FlowRunStatus.SUCCEEDED)
            expect(body.output).toEqual({ value: 42 })
        })

        it('hydrates input/output/logs from the offloaded log file', async () => {
            const ctx = await createTestContext(app!)
            const payload = Buffer.from(JSON.stringify({ input: { text: 'hi' }, output: { value: 99 }, logs: 'ran ok' }), 'utf-8')
            const file = await fileService(app!.log).save({
                projectId: ctx.project.id,
                platformId: ctx.platform.id,
                type: FileType.ADHOC_RUN_LOG,
                data: payload,
                size: payload.length,
                compression: FileCompression.NONE,
            })
            const run = createMockAdhocRun({
                projectId: ctx.project.id,
                platformId: ctx.platform.id,
                input: null,
                output: null,
                logs: null,
                logsFileId: file.id,
            })
            await db.save('adhoc_run', run)

            const response = await ctx.get(`/v1/adhoc-runs/${run.id}`)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.input).toEqual({ text: 'hi' })
            expect(body.output).toEqual({ value: 99 })
            expect(body.logs).toBe('ran ok')
        })

        it('blocks access to a run from another project', async () => {
            const ctxA = await createTestContext(app!)
            const ctxB = await createTestContext(app!)
            const runB = createMockAdhocRun({ projectId: ctxB.project.id, platformId: ctxB.platform.id })
            await db.save('adhoc_run', runB)

            const response = await ctxA.get(`/v1/adhoc-runs/${runB.id}`)

            expect(response?.statusCode).not.toBe(StatusCodes.OK)
        })
    })
})
