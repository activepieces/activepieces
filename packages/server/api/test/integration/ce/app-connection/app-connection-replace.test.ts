import { AppConnection, AppConnectionScope, FlowStatus, FlowVersionState } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import {
    createMockConnection,
    createMockFlow,
    createMockFlowVersion,
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

    it('rejects replacing a connection with itself', async () => {
        const ctx = await createTestContext(app!)

        const source = createMockConnection({
            platformId: ctx.platform.id,
            projectIds: [ctx.project.id],
            pieceName: PIECE_NAME,
        }, ctx.user.id)
        await db.save('app_connection', source)

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: source.id,
            projectId: ctx.project.id,
            deleteSourceConnection: true,
        })

        expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        const stillThere = await db.findOneBy<AppConnection>('app_connection', { id: source.id })
        expect(stillThere?.id).toBe(source.id)
    })

    it('rejects deleting a platform source from the project replace', async () => {
        const ctx = await createTestContext(app!)

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

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
            deleteSourceConnection: true,
        })

        expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        const stillThere = await db.findOneBy<AppConnection>('app_connection', { id: source.id })
        expect(stillThere?.id).toBe(source.id)
    })

    it('replaces flows off a platform source without deleting it', async () => {
        const ctx = await createTestContext(app!)

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

        const flow = createMockFlow({
            projectId: ctx.project.id,
            status: FlowStatus.DISABLED,
        })
        await db.save('flow', flow)
        const draftVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.DRAFT,
            connectionIds: [source.externalId],
        })
        await db.save('flow_version', draftVersion)

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
        })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        const stillThere = await db.findOneBy<AppConnection>('app_connection', { id: source.id })
        expect(stillThere?.id).toBe(source.id)
    })

    it('repoints draft flows before deleting the source', async () => {
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

        const flow = createMockFlow({
            projectId: ctx.project.id,
            status: FlowStatus.DISABLED,
        })
        await db.save('flow', flow)
        const draftVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.DRAFT,
            connectionIds: [source.externalId],
        })
        await db.save('flow_version', draftVersion)

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
            deleteSourceConnection: true,
        })

        // The delete only goes through after the final integrity gate confirms no
        // flow still references the source, so a 204 + deleted source proves the
        // draft was actually repointed first.
        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        const deleted = await db.findOneBy<AppConnection>('app_connection', { id: source.id })
        expect(deleted).toBeNull()
    })

    it('blocks deleting the source when published flows are not updated', async () => {
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

        const flow = createMockFlow({
            projectId: ctx.project.id,
            status: FlowStatus.DISABLED,
        })
        await db.save('flow', flow)
        const publishedVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.LOCKED,
            connectionIds: [source.externalId],
        })
        await db.save('flow_version', publishedVersion)
        flow.publishedVersionId = publishedVersion.id
        await db.save('flow', flow)

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

    it('blocks a draft-and-published replace when a published version it cannot see still references the source', async () => {
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

        // Published version still uses the source but the newer draft dropped it:
        // the replace cannot update that published version without overwriting
        // the draft, so a draft-and-published replace must refuse instead of
        // reporting success while the published flow stays on the old connection.
        const flow = createMockFlow({
            projectId: ctx.project.id,
            status: FlowStatus.DISABLED,
        })
        await db.save('flow', flow)
        const publishedVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.LOCKED,
            created: '2020-01-01T00:00:00.000Z',
            connectionIds: [source.externalId],
        })
        const newerDraftVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.DRAFT,
            created: '2020-06-01T00:00:00.000Z',
            connectionIds: [],
        })
        await db.save('flow_version', [publishedVersion, newerDraftVersion])
        flow.publishedVersionId = publishedVersion.id
        await db.save('flow', flow)

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
            applyToPublishedVersions: true,
        })

        expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        const stillThere = await db.findOneBy<AppConnection>('app_connection', { id: source.id })
        expect(stillThere?.id).toBe(source.id)
    })

    it('allows a draft-only replace even when a published version still references the source', async () => {
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

        const flow = createMockFlow({
            projectId: ctx.project.id,
            status: FlowStatus.DISABLED,
        })
        await db.save('flow', flow)
        const publishedVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.LOCKED,
            created: '2020-01-01T00:00:00.000Z',
            connectionIds: [source.externalId],
        })
        const newerDraftVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.DRAFT,
            created: '2020-06-01T00:00:00.000Z',
            connectionIds: [],
        })
        await db.save('flow_version', [publishedVersion, newerDraftVersion])
        flow.publishedVersionId = publishedVersion.id
        await db.save('flow', flow)

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
        })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        const stillThere = await db.findOneBy<AppConnection>('app_connection', { id: source.id })
        expect(stillThere?.id).toBe(source.id)
    })

    it('blocks deleting the source when a published version the replace cannot see still references it', async () => {
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

        // The published version still uses the source, but the newer draft dropped
        // it, so the flow is invisible to the replace's connection filter and its
        // published version would be orphaned by the delete.
        const flow = createMockFlow({
            projectId: ctx.project.id,
            status: FlowStatus.DISABLED,
        })
        await db.save('flow', flow)
        const publishedVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.LOCKED,
            created: '2020-01-01T00:00:00.000Z',
            connectionIds: [source.externalId],
        })
        const newerDraftVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.DRAFT,
            created: '2020-06-01T00:00:00.000Z',
            connectionIds: [],
        })
        await db.save('flow_version', [publishedVersion, newerDraftVersion])
        flow.publishedVersionId = publishedVersion.id
        await db.save('flow', flow)

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
            deleteSourceConnection: true,
            applyToPublishedVersions: true,
        })

        expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        const stillThere = await db.findOneBy<AppConnection>('app_connection', { id: source.id })
        expect(stillThere?.id).toBe(source.id)
    })
})
