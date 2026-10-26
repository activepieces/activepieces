import { isNil } from '@activepieces/core-utils'
import { AppConnection, AppConnectionScope, Flow, FlowStatus, FlowTrigger, FlowTriggerType, FlowVersion, FlowVersionState } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
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
const MISSING_PIECE_NAME = '@activepieces/piece-does-not-exist'

describe('POST /v1/app-connections/replace', () => {
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
            flowIds: ['unused-flow-id'],
        })

        expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        const stillThere = await db.findOneBy<AppConnection>('app_connection', { id: source.id })
        expect(stillThere?.id).toBe(source.id)
    })

    it('replaces flows off a platform source', async () => {
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
            flowIds: [flow.id],
        })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        const stillThere = await db.findOneBy<AppConnection>('app_connection', { id: source.id })
        expect(stillThere?.id).toBe(source.id)
    })

    it('republishes a flow whose published version uses the source but whose draft does not, and keeps the draft edits', async () => {
        const ctx = await createTestContext(app!)
        const { source, target } = await saveSourceAndTarget(ctx)

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
            trigger: pieceTrigger({ externalId: source.externalId, marker: 'published' }),
        })
        const draftWithoutSource = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.DRAFT,
            created: '2020-06-01T00:00:00.000Z',
            connectionIds: [target.externalId],
            trigger: pieceTrigger({ externalId: target.externalId, marker: 'draft-edit' }),
        })
        await db.save('flow_version', [publishedVersion, draftWithoutSource])
        flow.publishedVersionId = publishedVersion.id
        await db.save('flow', flow)

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
            flowIds: [flow.id],
            applyToPublishedVersions: true,
        })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        const updatedFlow = await db.findOneByOrFail<Flow>('flow', { id: flow.id })
        const versions = await versionsNewestFirst(flow.id)
        const republished = versions.find((v) => v.id === updatedFlow.publishedVersionId)
        expect(republished?.trigger.settings.input).toEqual({ auth: connectionRef(target.externalId), marker: 'published' })
        expect(versions[0].state).toBe(FlowVersionState.DRAFT)
        expect(versions[0].trigger.settings.input).toEqual({ auth: connectionRef(target.externalId), marker: 'draft-edit' })
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
            flowIds: [flow.id],
        })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        const stillThere = await db.findOneBy<AppConnection>('app_connection', { id: source.id })
        expect(stillThere?.id).toBe(source.id)
    })

    it('keeps unpublished draft edits and a disabled status on a draft-and-published replace', async () => {
        const ctx = await createTestContext(app!)
        const { source, target } = await saveSourceAndTarget(ctx)

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
            trigger: pieceTrigger({ externalId: source.externalId, marker: 'published', sampleDataFileId: 'published-sample-file' }),
        })
        const editedDraftVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.DRAFT,
            created: '2020-06-01T00:00:00.000Z',
            connectionIds: [source.externalId],
            trigger: pieceTrigger({ externalId: source.externalId, marker: 'draft-edit', sampleDataFileId: 'draft-sample-file' }),
        })
        await db.save('flow_version', [publishedVersion, editedDraftVersion])
        flow.publishedVersionId = publishedVersion.id
        await db.save('flow', flow)

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
            flowIds: [flow.id],
            applyToPublishedVersions: true,
        })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        const updatedFlow = await db.findOneByOrFail<Flow>('flow', { id: flow.id })
        expect(updatedFlow.status).toBe(FlowStatus.DISABLED)
        const versions = await versionsNewestFirst(flow.id)
        const republished = versions.find((v) => v.id === updatedFlow.publishedVersionId)
        expect(republished?.trigger.settings.input).toEqual({ auth: connectionRef(target.externalId), marker: 'published' })
        expect(versions[0].state).toBe(FlowVersionState.DRAFT)
        expect(versions[0].trigger.settings.input).toEqual({ auth: connectionRef(target.externalId), marker: 'draft-edit' })
        expect(versions[0].trigger.settings.sampleData?.sampleDataFileId).toBe('draft-sample-file')
    })

    it('restores unpublished draft edits when the republish fails', async () => {
        const ctx = await createTestContext(app!)
        const { source, target } = await saveSourceAndTarget(ctx)

        const flow = createMockFlow({
            projectId: ctx.project.id,
            status: FlowStatus.ENABLED,
        })
        await db.save('flow', flow)
        const publishedVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.LOCKED,
            created: '2020-01-01T00:00:00.000Z',
            connectionIds: [source.externalId],
            trigger: pieceTrigger({ externalId: source.externalId, marker: 'published', pieceName: MISSING_PIECE_NAME }),
        })
        const editedDraftVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.DRAFT,
            created: '2020-06-01T00:00:00.000Z',
            connectionIds: [source.externalId],
            trigger: pieceTrigger({ externalId: source.externalId, marker: 'draft-edit' }),
        })
        await db.save('flow_version', [publishedVersion, editedDraftVersion])
        flow.publishedVersionId = publishedVersion.id
        await db.save('flow', flow)

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
            flowIds: [flow.id],
            applyToPublishedVersions: true,
        })

        expect(response?.statusCode).not.toBe(StatusCodes.NO_CONTENT)
        const versions = await versionsNewestFirst(flow.id)
        expect(versions[0].state).toBe(FlowVersionState.DRAFT)
        expect(versions[0].trigger.settings.input).toEqual({ auth: connectionRef(target.externalId), marker: 'draft-edit' })
    })

    it('does not leave a new draft behind when a published flow had no draft edits', async () => {
        const ctx = await createTestContext(app!)
        const { source, target } = await saveSourceAndTarget(ctx)

        const flow = createMockFlow({
            projectId: ctx.project.id,
            status: FlowStatus.DISABLED,
        })
        await db.save('flow', flow)
        const publishedVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.LOCKED,
            connectionIds: [source.externalId],
            trigger: pieceTrigger({ externalId: source.externalId, marker: 'published' }),
        })
        await db.save('flow_version', publishedVersion)
        flow.publishedVersionId = publishedVersion.id
        await db.save('flow', flow)

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
            flowIds: [flow.id],
            applyToPublishedVersions: true,
        })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        const updatedFlow = await db.findOneByOrFail<Flow>('flow', { id: flow.id })
        expect(updatedFlow.status).toBe(FlowStatus.DISABLED)
        const versions = await versionsNewestFirst(flow.id)
        expect(versions[0].id).toBe(updatedFlow.publishedVersionId)
        expect(versions[0].state).toBe(FlowVersionState.LOCKED)
        expect(versions[0].trigger.settings.input).toEqual({ auth: connectionRef(target.externalId), marker: 'published' })
    })

    it('does not republish a flow when only its draft uses the source connection', async () => {
        const ctx = await createTestContext(app!)
        const { source, target } = await saveSourceAndTarget(ctx)

        const flow = createMockFlow({
            projectId: ctx.project.id,
            status: FlowStatus.ENABLED,
        })
        await db.save('flow', flow)
        const publishedVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.LOCKED,
            created: '2020-01-01T00:00:00.000Z',
            connectionIds: [target.externalId],
            trigger: pieceTrigger({ externalId: target.externalId, marker: 'published' }),
        })
        const editedDraftVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.DRAFT,
            created: '2020-06-01T00:00:00.000Z',
            connectionIds: [source.externalId],
            trigger: pieceTrigger({ externalId: source.externalId, marker: 'draft-edit' }),
        })
        await db.save('flow_version', [publishedVersion, editedDraftVersion])
        flow.publishedVersionId = publishedVersion.id
        await db.save('flow', flow)

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
            flowIds: [flow.id],
            applyToPublishedVersions: true,
        })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        const updatedFlow = await db.findOneByOrFail<Flow>('flow', { id: flow.id })
        expect(updatedFlow.status).toBe(FlowStatus.ENABLED)
        expect(updatedFlow.publishedVersionId).toBe(publishedVersion.id)
        const versions = await versionsNewestFirst(flow.id)
        expect(versions).toHaveLength(2)
        expect(versions[0].id).toBe(editedDraftVersion.id)
        expect(versions[0].state).toBe(FlowVersionState.DRAFT)
        expect(versions[0].trigger.settings.input).toEqual({ auth: connectionRef(target.externalId), marker: 'draft-edit' })
    })

    it('decides the republish per flow when one replace covers several flows', async () => {
        const ctx = await createTestContext(app!)
        const { source, target } = await saveSourceAndTarget(ctx)

        const draftOnlyFlow = createMockFlow({
            projectId: ctx.project.id,
            status: FlowStatus.ENABLED,
        })
        const publishedFlow = createMockFlow({
            projectId: ctx.project.id,
            status: FlowStatus.DISABLED,
        })
        await db.save('flow', [draftOnlyFlow, publishedFlow])
        const draftOnlyLiveVersion = createMockFlowVersion({
            flowId: draftOnlyFlow.id,
            state: FlowVersionState.LOCKED,
            created: '2020-01-01T00:00:00.000Z',
            connectionIds: [target.externalId],
            trigger: pieceTrigger({ externalId: target.externalId, marker: 'published' }),
        })
        const draftOnlyDraftVersion = createMockFlowVersion({
            flowId: draftOnlyFlow.id,
            state: FlowVersionState.DRAFT,
            created: '2020-06-01T00:00:00.000Z',
            connectionIds: [source.externalId],
            trigger: pieceTrigger({ externalId: source.externalId, marker: 'draft-edit' }),
        })
        const publishedLiveVersion = createMockFlowVersion({
            flowId: publishedFlow.id,
            state: FlowVersionState.LOCKED,
            created: '2020-01-01T00:00:00.000Z',
            connectionIds: [source.externalId],
            trigger: pieceTrigger({ externalId: source.externalId, marker: 'published' }),
        })
        const publishedDraftVersion = createMockFlowVersion({
            flowId: publishedFlow.id,
            state: FlowVersionState.DRAFT,
            created: '2020-06-01T00:00:00.000Z',
            connectionIds: [source.externalId],
            trigger: pieceTrigger({ externalId: source.externalId, marker: 'draft-edit' }),
        })
        await db.save('flow_version', [draftOnlyLiveVersion, draftOnlyDraftVersion, publishedLiveVersion, publishedDraftVersion])
        draftOnlyFlow.publishedVersionId = draftOnlyLiveVersion.id
        publishedFlow.publishedVersionId = publishedLiveVersion.id
        await db.save('flow', [draftOnlyFlow, publishedFlow])

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
            flowIds: [draftOnlyFlow.id, publishedFlow.id],
            applyToPublishedVersions: true,
        })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        const updatedDraftOnlyFlow = await db.findOneByOrFail<Flow>('flow', { id: draftOnlyFlow.id })
        expect(updatedDraftOnlyFlow.publishedVersionId).toBe(draftOnlyLiveVersion.id)
        expect(updatedDraftOnlyFlow.status).toBe(FlowStatus.ENABLED)
        const updatedPublishedFlow = await db.findOneByOrFail<Flow>('flow', { id: publishedFlow.id })
        expect(updatedPublishedFlow.publishedVersionId).not.toBe(publishedLiveVersion.id)
        const publishedFlowVersions = await versionsNewestFirst(publishedFlow.id)
        const republished = publishedFlowVersions.find((v) => v.id === updatedPublishedFlow.publishedVersionId)
        expect(republished?.trigger.settings.input).toEqual({ auth: connectionRef(target.externalId), marker: 'published' })
        expect(publishedFlowVersions[0].state).toBe(FlowVersionState.DRAFT)
        expect(publishedFlowVersions[0].trigger.settings.input).toEqual({ auth: connectionRef(target.externalId), marker: 'draft-edit' })
    })

    it('republishes the live version, and keeps a newer locked version that is not live in the draft', async () => {
        const ctx = await createTestContext(app!)
        const { source, target } = await saveSourceAndTarget(ctx)

        const flow = createMockFlow({
            projectId: ctx.project.id,
            status: FlowStatus.DISABLED,
        })
        await db.save('flow', flow)
        const liveVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.LOCKED,
            created: '2020-01-01T00:00:00.000Z',
            connectionIds: [source.externalId],
            trigger: pieceTrigger({ externalId: source.externalId, marker: 'published' }),
        })
        const submittedVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.LOCKED,
            created: '2020-06-01T00:00:00.000Z',
            connectionIds: [source.externalId],
            trigger: pieceTrigger({ externalId: source.externalId, marker: 'submitted' }),
        })
        await db.save('flow_version', [liveVersion, submittedVersion])
        flow.publishedVersionId = liveVersion.id
        await db.save('flow', flow)

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
            flowIds: [flow.id],
            applyToPublishedVersions: true,
        })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        const versions = await versionsNewestFirst(flow.id)
        const updatedFlow = await db.findOneBy<Flow>('flow', { id: flow.id })
        const newLiveVersion = versions.find((v) => v.id === updatedFlow?.publishedVersionId)
        expect(newLiveVersion?.id).not.toBe(liveVersion.id)
        expect(newLiveVersion?.trigger.settings.input).toEqual({ auth: connectionRef(target.externalId), marker: 'published' })
        expect(versions[0].state).toBe(FlowVersionState.DRAFT)
        expect(versions[0].trigger.settings.input).toEqual({ auth: connectionRef(target.externalId), marker: 'submitted' })
    })

    it('repoints only the listed flows, and keeps their sample data', async () => {
        const ctx = await createTestContext(app!)
        const { source, target } = await saveSourceAndTarget(ctx)

        const listedFlow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.DISABLED })
        const otherFlow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.DISABLED })
        await db.save('flow', [listedFlow, otherFlow])
        await db.save('flow_version', [
            createMockFlowVersion({
                flowId: listedFlow.id,
                state: FlowVersionState.DRAFT,
                connectionIds: [source.externalId],
                trigger: pieceTrigger({ externalId: source.externalId, marker: 'listed', sampleDataFileId: 'listed-sample' }),
            }),
            createMockFlowVersion({
                flowId: otherFlow.id,
                state: FlowVersionState.DRAFT,
                connectionIds: [source.externalId],
                trigger: pieceTrigger({ externalId: source.externalId, marker: 'other' }),
            }),
        ])

        const response = await ctx.post('/v1/app-connections/replace', {
            flowIds: [listedFlow.id],
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
        })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        const [listedVersion] = await versionsNewestFirst(listedFlow.id)
        expect(listedVersion.trigger.settings.input).toEqual({ auth: connectionRef(target.externalId), marker: 'listed' })
        expect(listedVersion.trigger.settings.sampleData?.sampleDataFileId).toBe('listed-sample')
        const [otherVersion] = await versionsNewestFirst(otherFlow.id)
        expect(otherVersion.trigger.settings.input).toEqual({ auth: connectionRef(source.externalId), marker: 'other' })
        const stillThere = await db.findOneBy<AppConnection>('app_connection', { id: source.id })
        expect(stillThere?.id).toBe(source.id)
    })

    it('rejects a flow from another project', async () => {
        const ctx = await createTestContext(app!)
        const otherCtx = await createTestContext(app!)
        const { source, target } = await saveSourceAndTarget(ctx)

        const foreignFlow = createMockFlow({ projectId: otherCtx.project.id, status: FlowStatus.DISABLED })
        await db.save('flow', foreignFlow)
        await db.save('flow_version', createMockFlowVersion({
            flowId: foreignFlow.id,
            state: FlowVersionState.DRAFT,
            connectionIds: [source.externalId],
            trigger: pieceTrigger({ externalId: source.externalId, marker: 'foreign' }),
        }))

        const response = await ctx.post('/v1/app-connections/replace', {
            flowIds: [foreignFlow.id],
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
        })

        expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response?.json().params.message).toContain(foreignFlow.id)
        const [foreignVersion] = await versionsNewestFirst(foreignFlow.id)
        expect(foreignVersion.trigger.settings.input).toEqual({ auth: connectionRef(source.externalId), marker: 'foreign' })
    })
})

async function saveSourceAndTarget(ctx: Awaited<ReturnType<typeof createTestContext>>): Promise<{ source: AppConnection, target: AppConnection }> {
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
    return { source, target }
}

function connectionRef(externalId: string): string {
    return `{{connections['${externalId}']}}`
}

function pieceTrigger({ externalId, marker, pieceName = PIECE_NAME, sampleDataFileId }: { externalId: string, marker: string, pieceName?: string, sampleDataFileId?: string }): FlowTrigger {
    return {
        type: FlowTriggerType.PIECE,
        name: 'trigger',
        displayName: 'Trigger',
        valid: true,
        lastUpdatedDate: dayjs().toISOString(),
        settings: {
            pieceName,
            pieceVersion: '0.1.0',
            triggerName: 'new_message',
            input: { auth: connectionRef(externalId), marker },
            propertySettings: {},
            sampleData: isNil(sampleDataFileId) ? undefined : { sampleDataFileId },
        },
    }
}

async function versionsNewestFirst(flowId: string): Promise<FlowVersion[]> {
    return databaseConnection().getRepository<FlowVersion>('flow_version').find({
        where: { flowId },
        order: { created: 'DESC' },
    })
}
