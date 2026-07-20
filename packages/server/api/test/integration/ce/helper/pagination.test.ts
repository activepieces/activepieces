import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { db } from '../../../helpers/db'
import { createMockFolder, createMockTable } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const SHARED_CREATED = '2026-01-01T00:00:00.000Z'

async function seedFolders(ctx: TestContext, count: number): Promise<string[]> {
    const folders = Array.from({ length: count }, (_item, index) =>
        createMockFolder({
            projectId: ctx.project.id,
            displayName: `folder-${index}`,
            created: SHARED_CREATED,
        }),
    )
    await db.save('folder', folders)
    return folders.map((folder) => folder.id)
}

async function listAllPages({ ctx, path, limit }: { ctx: TestContext, path: string, limit: number }): Promise<{ ids: string[], pages: number }> {
    const ids: string[] = []
    let cursor: string | null = null
    let pages = 0

    do {
        const response = await ctx.get(path, {
            projectId: ctx.project.id,
            limit,
            ...(cursor ? { cursor } : {}),
        })
        expect(response?.statusCode).toBe(StatusCodes.OK)
        const body = response?.json()
        ids.push(...body.data.map((row: { id: string }) => row.id))
        cursor = body.next
        pages++
    } while (cursor !== null && pages < 10)

    return { ids, pages }
}

describe('cursor pagination with duplicate timestamps', () => {
    it('returns every row when all rows share the same created timestamp', async () => {
        const ctx = await createTestContext(app)
        const seededIds = await seedFolders(ctx, 15)

        const { ids, pages } = await listAllPages({ ctx, path: '/v1/folders', limit: 10 })

        expect(pages).toBe(2)
        expect(ids).toHaveLength(15)
        expect(new Set(ids).size).toBe(15)
        expect(ids.sort()).toEqual(seededIds.sort())
    })

    it('returns every row when timestamps carry microsecond precision', async () => {
        const ctx = await createTestContext(app)
        const seededIds = await seedFolders(ctx, 15)
        await databaseConnection().query(
            'UPDATE folder SET created = $1 WHERE "projectId" = $2',
            ['2026-01-01 00:00:00.123456+00', ctx.project.id],
        )

        const { ids } = await listAllPages({ ctx, path: '/v1/folders', limit: 10 })

        expect(ids).toHaveLength(15)
        expect(new Set(ids).size).toBe(15)
        expect(ids.sort()).toEqual(seededIds.sort())
    })

    it('pages backward to the first page with the previous cursor', async () => {
        const ctx = await createTestContext(app)
        await seedFolders(ctx, 15)

        const firstPage = await ctx.get('/v1/folders', {
            projectId: ctx.project.id,
            limit: 10,
        })
        const firstPageBody = firstPage?.json()
        const secondPage = await ctx.get('/v1/folders', {
            projectId: ctx.project.id,
            limit: 10,
            cursor: firstPageBody.next,
        })
        const secondPageBody = secondPage?.json()
        const backPage = await ctx.get('/v1/folders', {
            projectId: ctx.project.id,
            limit: 10,
            cursor: secondPageBody.previous,
        })
        const backPageBody = backPage?.json()

        expect(backPage?.statusCode).toBe(StatusCodes.OK)
        expect(backPageBody.data.map((folder: { id: string }) => folder.id))
            .toEqual(firstPageBody.data.map((folder: { id: string }) => folder.id))
    })

    it('paginates entities whose table name is a reserved SQL word', async () => {
        const ctx = await createTestContext(app)
        const tables = Array.from({ length: 15 }, (_item, index) => ({
            ...createMockTable({ projectId: ctx.project.id }),
            name: `table-${index}`,
            created: SHARED_CREATED,
        }))
        await db.save('table', tables)

        const { ids } = await listAllPages({ ctx, path: '/v1/tables', limit: 10 })

        expect(ids).toHaveLength(15)
        expect(new Set(ids).size).toBe(15)
    })

    it('treats a cursor with an invalid timestamp value as the first page', async () => {
        const ctx = await createTestContext(app)
        await seedFolders(ctx, 5)

        const inner = Buffer.from(JSON.stringify({ created: 'not-a-date', id: 'x' })).toString('base64')
        const cursor = Buffer.from(`next_${inner}`).toString('base64')

        const response = await ctx.get('/v1/folders', {
            projectId: ctx.project.id,
            limit: 10,
            cursor,
        })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response?.json().data).toHaveLength(5)
    })

    it('treats a cursor missing leading order fields as the first page', async () => {
        const ctx = await createTestContext(app)
        await seedFolders(ctx, 5)

        const inner = Buffer.from(JSON.stringify({ id: 'zzzzzzzzzzzzzzzzzzzzz' })).toString('base64')
        const cursor = Buffer.from(`next_${inner}`).toString('base64')

        const response = await ctx.get('/v1/folders', {
            projectId: ctx.project.id,
            limit: 10,
            cursor,
        })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response?.json().data).toHaveLength(5)
    })

    it('accepts a legacy single-key cursor without failing', async () => {
        const ctx = await createTestContext(app)
        await seedFolders(ctx, 5)

        const legacyInner = Buffer.from(`created:${Date.parse(SHARED_CREATED)}`).toString('base64')
        const legacyCursor = Buffer.from(`next_${legacyInner}`).toString('base64')

        const response = await ctx.get('/v1/folders', {
            projectId: ctx.project.id,
            limit: 10,
            cursor: legacyCursor,
        })

        expect(response?.statusCode).toBe(StatusCodes.OK)
    })
})
