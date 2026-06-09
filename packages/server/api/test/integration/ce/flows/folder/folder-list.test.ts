import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../../helpers/db'
import {
    createMockFlow,
    createMockFlowVersion,
    createMockFolder,
    createMockTable,
} from '../../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function saveFlowInFolder(ctx: TestContext, folderId: string | null): Promise<string> {
    const flow = createMockFlow({ projectId: ctx.project.id, folderId })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({ flowId: flow.id })
    await db.save('flow_version', flowVersion)
    return flow.id
}

async function saveTableInFolder(ctx: TestContext, folderId: string | null): Promise<string> {
    const table = { ...createMockTable({ projectId: ctx.project.id }), folderId }
    await db.save('table', table)
    return table.id
}

describe('Folder N+1 fix', () => {
    describe('GET /v1/folders enrichment', () => {
        it('returns numberOfFlows and numberOfTables per folder', async () => {
            const ctx = await createTestContext(app)
            const folder = createMockFolder({ projectId: ctx.project.id })
            await db.save('folder', folder)

            await saveFlowInFolder(ctx, folder.id)
            await saveFlowInFolder(ctx, folder.id)
            await saveTableInFolder(ctx, folder.id)

            const response = await ctx.get('/v1/folders', {
                projectId: ctx.project.id,
                limit: 100,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const target = response?.json().data.find((f: { id: string }) => f.id === folder.id)
            expect(target.numberOfFlows).toBe(2)
            expect(target.numberOfTables).toBe(1)
        })
    })

    describe('GET /v1/flows?folderIds', () => {
        it('returns flows from the given folders only', async () => {
            const ctx = await createTestContext(app)
            const folderA = createMockFolder({ projectId: ctx.project.id })
            const folderB = createMockFolder({ projectId: ctx.project.id })
            const folderC = createMockFolder({ projectId: ctx.project.id })
            await db.save('folder', folderA)
            await db.save('folder', folderB)
            await db.save('folder', folderC)

            const flowA = await saveFlowInFolder(ctx, folderA.id)
            const flowB = await saveFlowInFolder(ctx, folderB.id)
            await saveFlowInFolder(ctx, folderC.id)
            await saveFlowInFolder(ctx, null)

            const response = await ctx.get('/v1/flows', {
                projectId: ctx.project.id,
                folderIds: [folderA.id, folderB.id],
                limit: 100,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const ids = response?.json().data.map((f: { id: string }) => f.id).sort()
            expect(ids).toEqual([flowA, flowB].sort())
        })
    })

    describe('GET /v1/tables?folderIds', () => {
        it('returns tables from the given folders only', async () => {
            const ctx = await createTestContext(app)
            const folderA = createMockFolder({ projectId: ctx.project.id })
            const folderB = createMockFolder({ projectId: ctx.project.id })
            await db.save('folder', folderA)
            await db.save('folder', folderB)

            const tableA = await saveTableInFolder(ctx, folderA.id)
            await saveTableInFolder(ctx, folderB.id)
            await saveTableInFolder(ctx, null)

            const response = await ctx.get('/v1/tables', {
                projectId: ctx.project.id,
                folderIds: [folderA.id],
                limit: 100,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const ids = response?.json().data.map((t: { id: string }) => t.id)
            expect(ids).toEqual([tableA])
        })
    })
})
