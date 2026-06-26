import { AppConnection, AppConnectionScope } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import {
    createMockConnection,
    createMockFlow,
    createMockFlowVersion,
    createMockProject,
} from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const PIECE_NAME = '@activepieces/piece-slack'

describe('POST /v1/app-connections/replace', () => {
    it('keeps the source connection when deleteSourceConnection is not set', async () => {
        const ctx = await createTestContext(app!)

        const source = createMockConnection({
            platformId: ctx.platform.id,
            projectIds: [ctx.project.id],
            pieceName: PIECE_NAME,
        }, ctx.user.id)
        const target = createMockConnection({
            platformId: ctx.platform.id,
            projectIds: [ctx.project.id],
            pieceName: PIECE_NAME,
        }, ctx.user.id)
        await db.save('app_connection', [source, target])

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
        })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        const stillThere = await db.findOneBy<AppConnection>('app_connection', { id: source.id })
        expect(stillThere?.id).toBe(source.id)
    })

    it('deletes the source connection when deleteSourceConnection is true', async () => {
        const ctx = await createTestContext(app!)

        const source = createMockConnection({
            platformId: ctx.platform.id,
            projectIds: [ctx.project.id],
            pieceName: PIECE_NAME,
        }, ctx.user.id)
        const target = createMockConnection({
            platformId: ctx.platform.id,
            projectIds: [ctx.project.id],
            pieceName: PIECE_NAME,
        }, ctx.user.id)
        await db.save('app_connection', [source, target])

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
            deleteSourceConnection: true,
        })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        const deleted = await db.findOneBy<AppConnection>('app_connection', { id: source.id })
        expect(deleted).toBeNull()
    })

    it('blocks deleting a platform source still referenced by another project', async () => {
        const ctx = await createTestContext(app!)

        const otherProject = createMockProject({
            platformId: ctx.platform.id,
            ownerId: ctx.user.id,
        })
        await db.save('project', otherProject)

        const source: AppConnection = {
            ...createMockConnection({
                platformId: ctx.platform.id,
                projectIds: [ctx.project.id, otherProject.id],
                pieceName: PIECE_NAME,
            }, ctx.user.id),
            scope: AppConnectionScope.PLATFORM,
        }
        const target = createMockConnection({
            platformId: ctx.platform.id,
            projectIds: [ctx.project.id],
            pieceName: PIECE_NAME,
        }, ctx.user.id)
        await db.save('app_connection', [source, target])

        const otherProjectFlow = createMockFlow({ projectId: otherProject.id })
        await db.save('flow', otherProjectFlow)
        const otherProjectFlowVersion = createMockFlowVersion({
            flowId: otherProjectFlow.id,
            connectionIds: [source.externalId],
        })
        await db.save('flow_version', otherProjectFlowVersion)

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
            deleteSourceConnection: true,
        })

        expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        const stillThere = await db.findOneBy<AppConnection>('app_connection', { id: source.id })
        expect(stillThere?.id).toBe(source.id)
    })

    it('allows deleting a platform source when another project only shares the externalId via its own connection', async () => {
        const ctx = await createTestContext(app!)

        const otherProject = createMockProject({
            platformId: ctx.platform.id,
            ownerId: ctx.user.id,
        })
        await db.save('project', otherProject)

        const source: AppConnection = {
            ...createMockConnection({
                platformId: ctx.platform.id,
                projectIds: [ctx.project.id],
                pieceName: PIECE_NAME,
            }, ctx.user.id),
            scope: AppConnectionScope.PLATFORM,
        }
        const target = createMockConnection({
            platformId: ctx.platform.id,
            projectIds: [ctx.project.id],
            pieceName: PIECE_NAME,
        }, ctx.user.id)
        await db.save('app_connection', [source, target])

        const otherProjectFlow = createMockFlow({ projectId: otherProject.id })
        await db.save('flow', otherProjectFlow)
        const otherProjectFlowVersion = createMockFlowVersion({
            flowId: otherProjectFlow.id,
            connectionIds: [source.externalId],
        })
        await db.save('flow_version', otherProjectFlowVersion)

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
            deleteSourceConnection: true,
        })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        const deleted = await db.findOneBy<AppConnection>('app_connection', { id: source.id })
        expect(deleted).toBeNull()
    })

    it('blocks deleting a platform source when another project keeps it only in a published version', async () => {
        const ctx = await createTestContext(app!)

        const otherProject = createMockProject({
            platformId: ctx.platform.id,
            ownerId: ctx.user.id,
        })
        await db.save('project', otherProject)

        const source: AppConnection = {
            ...createMockConnection({
                platformId: ctx.platform.id,
                projectIds: [ctx.project.id, otherProject.id],
                pieceName: PIECE_NAME,
            }, ctx.user.id),
            scope: AppConnectionScope.PLATFORM,
        }
        const target = createMockConnection({
            platformId: ctx.platform.id,
            projectIds: [ctx.project.id],
            pieceName: PIECE_NAME,
        }, ctx.user.id)
        await db.save('app_connection', [source, target])

        const otherProjectFlow = createMockFlow({ projectId: otherProject.id })
        await db.save('flow', otherProjectFlow)
        const publishedVersion = createMockFlowVersion({
            flowId: otherProjectFlow.id,
            created: '2020-01-01T00:00:00.000Z',
            connectionIds: [source.externalId],
        })
        const newerDraftVersion = createMockFlowVersion({
            flowId: otherProjectFlow.id,
            created: '2020-06-01T00:00:00.000Z',
            connectionIds: [],
        })
        await db.save('flow_version', [publishedVersion, newerDraftVersion])
        otherProjectFlow.publishedVersionId = publishedVersion.id
        await db.save('flow', otherProjectFlow)

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
            deleteSourceConnection: true,
        })

        expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        const stillThere = await db.findOneBy<AppConnection>('app_connection', { id: source.id })
        expect(stillThere?.id).toBe(source.id)
    })
})
