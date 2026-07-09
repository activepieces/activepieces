import { apId } from '@activepieces/core-utils'
import { PieceRun, PieceRunKind, PieceRunSource, FileCompression, FileType, FlowRunStatus } from '@activepieces/shared'
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

function createMockPieceRun(params: { projectId: string, platformId: string } & Partial<PieceRun>): PieceRun {
    const now = dayjs().toISOString()
    return {
        id: apId(),
        created: now,
        updated: now,
        projectId: params.projectId,
        platformId: params.platformId,
        userId: null,
        kind: PieceRunKind.PIECE,
        pieceName: '@activepieces/piece-slack',
        pieceVersion: '0.1.0',
        actionName: 'send_channel_message',
        connectionExternalId: null,
        source: PieceRunSource.MCP,
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

describe('Piece Run API', () => {
    describe('GET /v1/piece-runs (List)', () => {
        it('returns the project piece runs newest-first', async () => {
            const ctx = await createTestContext(app!)
            const older = createMockPieceRun({ projectId: ctx.project.id, platformId: ctx.platform.id, created: dayjs().subtract(2, 'minute').toISOString(), actionName: 'older' })
            const newer = createMockPieceRun({ projectId: ctx.project.id, platformId: ctx.platform.id, created: dayjs().toISOString(), actionName: 'newer' })
            await db.save('piece_run', older)
            await db.save('piece_run', newer)

            const response = await ctx.get('/v1/piece-runs', { projectId: ctx.project.id })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data).toHaveLength(2)
            expect(body.data[0].id).toBe(newer.id)
            expect(body.data[1].id).toBe(older.id)
        })

        it('paginates with a cursor', async () => {
            const ctx = await createTestContext(app!)
            for (let i = 0; i < 3; i++) {
                await db.save('piece_run', createMockPieceRun({ projectId: ctx.project.id, platformId: ctx.platform.id, created: dayjs().add(i, 'second').toISOString() }))
            }

            const firstPage = await ctx.get('/v1/piece-runs', { projectId: ctx.project.id, limit: '2' })
            expect(firstPage?.statusCode).toBe(StatusCodes.OK)
            const firstBody = firstPage?.json()
            expect(firstBody.data).toHaveLength(2)
            expect(firstBody.next).toBeDefined()

            const secondPage = await ctx.get('/v1/piece-runs', { projectId: ctx.project.id, limit: '2', cursor: firstBody.next })
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
            const run = createMockPieceRun({
                projectId: ctx.project.id,
                platformId: ctx.platform.id,
                userId: ctx.user.id,
                connectionExternalId: connection.externalId,
            })
            await db.save('piece_run', run)

            const response = await ctx.get('/v1/piece-runs', { projectId: ctx.project.id })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data).toHaveLength(1)
            expect(body.data[0].connectionDisplayName).toBe('My Slack')
            expect(body.data[0].userName).toBe(`${ctx.userIdentity.firstName} ${ctx.userIdentity.lastName}`.trim())
        })

        it('returns null enrichment when the connection and user are absent', async () => {
            const ctx = await createTestContext(app!)
            await db.save('piece_run', createMockPieceRun({ projectId: ctx.project.id, platformId: ctx.platform.id }))

            const response = await ctx.get('/v1/piece-runs', { projectId: ctx.project.id })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data[0].connectionDisplayName).toBeNull()
            expect(body.data[0].userName).toBeNull()
        })

        it('does not leak runs from another project', async () => {
            const ctxA = await createTestContext(app!)
            const ctxB = await createTestContext(app!)
            await db.save('piece_run', createMockPieceRun({ projectId: ctxB.project.id, platformId: ctxB.platform.id }))

            const response = await ctxA.get('/v1/piece-runs', { projectId: ctxA.project.id })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().data).toHaveLength(0)
        })

        it('filters by status', async () => {
            const ctx = await createTestContext(app!)
            const succeeded = createMockPieceRun({ projectId: ctx.project.id, platformId: ctx.platform.id, status: FlowRunStatus.SUCCEEDED })
            const failed = createMockPieceRun({ projectId: ctx.project.id, platformId: ctx.platform.id, status: FlowRunStatus.FAILED })
            await db.save('piece_run', succeeded)
            await db.save('piece_run', failed)

            const response = await ctx.get('/v1/piece-runs', { projectId: ctx.project.id, status: [FlowRunStatus.FAILED] })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data).toHaveLength(1)
            expect(body.data[0].id).toBe(failed.id)
        })

        it('filters by source', async () => {
            const ctx = await createTestContext(app!)
            const mcp = createMockPieceRun({ projectId: ctx.project.id, platformId: ctx.platform.id, source: PieceRunSource.MCP })
            const chat = createMockPieceRun({ projectId: ctx.project.id, platformId: ctx.platform.id, source: PieceRunSource.CHAT })
            await db.save('piece_run', mcp)
            await db.save('piece_run', chat)

            const response = await ctx.get('/v1/piece-runs', { projectId: ctx.project.id, source: [PieceRunSource.CHAT] })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data).toHaveLength(1)
            expect(body.data[0].id).toBe(chat.id)
        })

        it('filters by created date range', async () => {
            const ctx = await createTestContext(app!)
            const old = createMockPieceRun({ projectId: ctx.project.id, platformId: ctx.platform.id, created: dayjs().subtract(10, 'day').toISOString() })
            const recent = createMockPieceRun({ projectId: ctx.project.id, platformId: ctx.platform.id, created: dayjs().toISOString() })
            await db.save('piece_run', old)
            await db.save('piece_run', recent)

            const response = await ctx.get('/v1/piece-runs', {
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
            const active = createMockPieceRun({ projectId: ctx.project.id, platformId: ctx.platform.id })
            const archived = createMockPieceRun({ projectId: ctx.project.id, platformId: ctx.platform.id, archivedAt: dayjs().toISOString() })
            await db.save('piece_run', active)
            await db.save('piece_run', archived)

            const defaultResponse = await ctx.get('/v1/piece-runs', { projectId: ctx.project.id })
            expect(defaultResponse?.statusCode).toBe(StatusCodes.OK)
            const defaultBody = defaultResponse?.json()
            expect(defaultBody.data).toHaveLength(1)
            expect(defaultBody.data[0].id).toBe(active.id)

            const includeResponse = await ctx.get('/v1/piece-runs', { projectId: ctx.project.id, includeArchived: 'true' })
            expect(includeResponse?.statusCode).toBe(StatusCodes.OK)
            expect(includeResponse?.json().data).toHaveLength(2)
        })
    })

    describe('POST /v1/piece-runs/archive (Archive)', () => {
        it('archives the selected runs', async () => {
            const ctx = await createTestContext(app!)
            const target = createMockPieceRun({ projectId: ctx.project.id, platformId: ctx.platform.id })
            const other = createMockPieceRun({ projectId: ctx.project.id, platformId: ctx.platform.id })
            await db.save('piece_run', target)
            await db.save('piece_run', other)

            const response = await ctx.post('/v1/piece-runs/archive', { projectId: ctx.project.id, pieceRunIds: [target.id] })
            expect(response?.statusCode).toBe(StatusCodes.OK)

            const list = await ctx.get('/v1/piece-runs', { projectId: ctx.project.id })
            const body = list?.json()
            expect(body.data).toHaveLength(1)
            expect(body.data[0].id).toBe(other.id)
        })

        it('archives all matching runs except the excluded ones', async () => {
            const ctx = await createTestContext(app!)
            const kept = createMockPieceRun({ projectId: ctx.project.id, platformId: ctx.platform.id })
            const archivedA = createMockPieceRun({ projectId: ctx.project.id, platformId: ctx.platform.id })
            const archivedB = createMockPieceRun({ projectId: ctx.project.id, platformId: ctx.platform.id })
            await db.save('piece_run', kept)
            await db.save('piece_run', archivedA)
            await db.save('piece_run', archivedB)

            const response = await ctx.post('/v1/piece-runs/archive', { projectId: ctx.project.id, excludePieceRunIds: [kept.id] })
            expect(response?.statusCode).toBe(StatusCodes.OK)

            const list = await ctx.get('/v1/piece-runs', { projectId: ctx.project.id })
            const body = list?.json()
            expect(body.data).toHaveLength(1)
            expect(body.data[0].id).toBe(kept.id)
        })

        it('does not archive runs from another project', async () => {
            const ctxA = await createTestContext(app!)
            const ctxB = await createTestContext(app!)
            const runB = createMockPieceRun({ projectId: ctxB.project.id, platformId: ctxB.platform.id })
            await db.save('piece_run', runB)

            const response = await ctxA.post('/v1/piece-runs/archive', { projectId: ctxA.project.id, pieceRunIds: [runB.id] })
            expect(response?.statusCode).toBe(StatusCodes.OK)

            const list = await ctxB.get('/v1/piece-runs', { projectId: ctxB.project.id })
            expect(list?.json().data).toHaveLength(1)
        })
    })

    describe('GET /v1/piece-runs/:id (Get)', () => {
        it('returns the piece run with its output', async () => {
            const ctx = await createTestContext(app!)
            const run = createMockPieceRun({ projectId: ctx.project.id, platformId: ctx.platform.id, output: { value: 42 } })
            await db.save('piece_run', run)

            const response = await ctx.get(`/v1/piece-runs/${run.id}`)

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
                type: FileType.PIECE_RUN_LOG,
                data: payload,
                size: payload.length,
                compression: FileCompression.NONE,
            })
            const run = createMockPieceRun({
                projectId: ctx.project.id,
                platformId: ctx.platform.id,
                input: null,
                output: null,
                logs: null,
                logsFileId: file.id,
            })
            await db.save('piece_run', run)

            const response = await ctx.get(`/v1/piece-runs/${run.id}`)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.input).toEqual({ text: 'hi' })
            expect(body.output).toEqual({ value: 99 })
            expect(body.logs).toBe('ran ok')
        })

        it('blocks access to a run from another project', async () => {
            const ctxA = await createTestContext(app!)
            const ctxB = await createTestContext(app!)
            const runB = createMockPieceRun({ projectId: ctxB.project.id, platformId: ctxB.platform.id })
            await db.save('piece_run', runB)

            const response = await ctxA.get(`/v1/piece-runs/${runB.id}`)

            expect(response?.statusCode).not.toBe(StatusCodes.OK)
        })
    })
})
