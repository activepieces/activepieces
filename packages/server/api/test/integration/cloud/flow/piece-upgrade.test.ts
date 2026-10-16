import { apId } from '@activepieces/core-utils'
import { ApplicationEventName, Flow, FlowStatus, FlowTrigger, FlowTriggerType, FlowVersion, FlowVersionState } from '@activepieces/shared'
import dayjs, { Dayjs } from 'dayjs'
import { FastifyInstance, LightMyRequestResponse } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { pieceUpgradeRegister } from '../../../../src/app/flows/flow-version/piece-upgrade-register'
import { db } from '../../../helpers/db'
import { draftPushes } from '../../../helpers/draft-push'
import { createMockFlow, createMockFlowVersion } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(() => {
    vi.spyOn(pieceUpgradeRegister, 'lookup').mockImplementation(async ({ pieceName, pieceVersion }) =>
        pieceName === WEBHOOK_PIECE_NAME && pieceVersion === OLD_WEBHOOK_VERSION
            ? { target: NEW_WEBHOOK_VERSION }
            : undefined)
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('POST /v1/admin/flows/upgrade-pieces', () => {
    it('sends a Draft Push with a null editor session id when the upgrade changes the draft', async () => {
        const ctx = await createTestContext(app!)
        const { flow } = await seedDraftFlow({ ctx, pieceVersion: OLD_WEBHOOK_VERSION })
        const pushes = draftPushes.capture()

        const response = await postAdminFlowsEndpoint({ route: 'upgrade-pieces', body: { flowIds: [flow.id] } })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()[0].upgradedSteps).toHaveLength(1)
        expect(pushes).toEqual([{
            room: ctx.project.id,
            payload: { flowId: flow.id, editorSessionId: null },
        }])
    })

    it('sends a push only for the flow whose draft it changes', async () => {
        const ctx = await createTestContext(app!)
        const { flow: upgradedFlow } = await seedDraftFlow({ ctx, pieceVersion: OLD_WEBHOOK_VERSION })
        const { flow: currentFlow } = await seedDraftFlow({ ctx, pieceVersion: NEW_WEBHOOK_VERSION })
        const pushes = draftPushes.capture()

        const response = await postAdminFlowsEndpoint({ route: 'upgrade-pieces', body: { flowIds: [upgradedFlow.id, currentFlow.id] } })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(pushes).toEqual([{
            room: ctx.project.id,
            payload: { flowId: upgradedFlow.id, editorSessionId: null },
        }])
    })

    it('sends a Draft Push when the latest version is the published version', async () => {
        const ctx = await createTestContext(app!)
        const { flow } = await seedPublishedFlow({ ctx, pieceVersion: OLD_WEBHOOK_VERSION })
        const pushes = draftPushes.capture()

        const response = await postAdminFlowsEndpoint({ route: 'upgrade-pieces', body: { flowIds: [flow.id] } })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(pushes).toEqual([{
            room: ctx.project.id,
            payload: { flowId: flow.id, editorSessionId: null },
        }])
    })

    it('sends no push when the upgrade changes only the published version', async () => {
        const ctx = await createTestContext(app!)
        const { flow, publishedVersion } = await seedPublishedFlowWithDraft({
            ctx,
            publishedPieceVersion: OLD_WEBHOOK_VERSION,
            draftPieceVersion: NEW_WEBHOOK_VERSION,
        })
        const pushes = draftPushes.capture()

        const response = await postAdminFlowsEndpoint({ route: 'upgrade-pieces', body: { flowIds: [flow.id] } })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()[0].upgradedSteps).toEqual([expect.objectContaining({ flowVersionId: publishedVersion.id })])
        expect(pushes).toEqual([])
    })
})

describe('POST /v1/admin/flows/revert-upgrade', () => {
    it('sends a Draft Push with a null editor session id when the revert changes the draft', async () => {
        const ctx = await createTestContext(app!)
        const { flow, draftVersion } = await seedDraftFlow({ ctx, pieceVersion: NEW_WEBHOOK_VERSION })
        await seedUpgradeAuditEvent({ ctx, flowId: flow.id, flowVersionId: draftVersion.id })
        const pushes = draftPushes.capture()

        const response = await postAdminFlowsEndpoint({ route: 'revert-upgrade', body: { flowIds: [flow.id] } })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()[0].upgradedSteps).toHaveLength(1)
        expect(pushes).toEqual([{
            room: ctx.project.id,
            payload: { flowId: flow.id, editorSessionId: null },
        }])
    })

    it('sends no push when the revert changes only the published version', async () => {
        const ctx = await createTestContext(app!)
        const { flow, publishedVersion } = await seedPublishedFlowWithDraft({
            ctx,
            publishedPieceVersion: NEW_WEBHOOK_VERSION,
            draftPieceVersion: NEW_WEBHOOK_VERSION,
        })
        await seedUpgradeAuditEvent({ ctx, flowId: flow.id, flowVersionId: publishedVersion.id })
        const pushes = draftPushes.capture()

        const response = await postAdminFlowsEndpoint({ route: 'revert-upgrade', body: { flowIds: [flow.id] } })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()[0].upgradedSteps).toEqual([expect.objectContaining({ flowVersionId: publishedVersion.id })])
        expect(pushes).toEqual([])
    })
})

async function seedDraftFlow({ ctx, pieceVersion }: SeedDraftFlowParams): Promise<DraftFlow> {
    const flow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.DISABLED, publishedVersionId: null })
    await db.save('flow', flow)
    const draftVersion = await saveVersion({ flowId: flow.id, state: FlowVersionState.DRAFT, pieceVersion, created: dayjs() })
    return { flow, draftVersion }
}

async function seedPublishedFlow({ ctx, pieceVersion }: SeedPublishedFlowParams): Promise<PublishedFlow> {
    const flow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.DISABLED, publishedVersionId: null })
    await db.save('flow', flow)
    const publishedVersion = await saveVersion({ flowId: flow.id, state: FlowVersionState.LOCKED, pieceVersion, created: dayjs() })
    await db.update('flow', flow.id, { publishedVersionId: publishedVersion.id })
    return { flow, publishedVersion }
}

async function seedPublishedFlowWithDraft({ ctx, publishedPieceVersion, draftPieceVersion }: SeedPublishedFlowWithDraftParams): Promise<PublishedFlowWithDraft> {
    const flow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.DISABLED, publishedVersionId: null })
    await db.save('flow', flow)
    const publishedVersion = await saveVersion({ flowId: flow.id, state: FlowVersionState.LOCKED, pieceVersion: publishedPieceVersion, created: dayjs().subtract(1, 'hour') })
    await db.update('flow', flow.id, { publishedVersionId: publishedVersion.id })
    const draftVersion = await saveVersion({ flowId: flow.id, state: FlowVersionState.DRAFT, pieceVersion: draftPieceVersion, created: dayjs() })
    return { flow, draftVersion, publishedVersion }
}

async function saveVersion({ flowId, state, pieceVersion, created }: SaveVersionParams): Promise<FlowVersion> {
    const version = createMockFlowVersion({
        flowId,
        state,
        trigger: webhookTrigger(pieceVersion),
        created: created.toISOString(),
    })
    await db.save('flow_version', version)
    return version
}

async function seedUpgradeAuditEvent({ ctx, flowId, flowVersionId }: SeedUpgradeAuditEventParams): Promise<void> {
    const now = dayjs().toISOString()
    await db.save('audit_event', {
        id: apId(),
        created: now,
        updated: now,
        platformId: ctx.platform.id,
        projectId: ctx.project.id,
        action: ApplicationEventName.FLOW_PIECES_UPGRADED,
        data: {
            flowId,
            flowVersionId,
            steps: [{
                stepName: 'trigger',
                actionOrTriggerName: 'catch_webhook',
                decision: 'UPGRADED',
                prevVersion: OLD_WEBHOOK_VERSION,
                newVersion: NEW_WEBHOOK_VERSION,
            }],
        },
    })
}

function webhookTrigger(pieceVersion: string): FlowTrigger {
    return {
        name: 'trigger',
        valid: true,
        displayName: 'Catch Webhook',
        lastUpdatedDate: dayjs().toISOString(),
        type: FlowTriggerType.PIECE,
        settings: {
            pieceName: WEBHOOK_PIECE_NAME,
            pieceVersion,
            triggerName: 'catch_webhook',
            input: {},
            propertySettings: {},
        },
    }
}

function postAdminFlowsEndpoint({ route, body }: PostAdminFlowsEndpointParams): Promise<LightMyRequestResponse> {
    return app!.inject({
        method: 'POST',
        url: `/api/v1/admin/flows/${route}`,
        headers: {
            'api-key': 'api-key',
        },
        body,
    })
}

const WEBHOOK_PIECE_NAME = '@activepieces/piece-webhook'
const OLD_WEBHOOK_VERSION = '0.1.33'
const NEW_WEBHOOK_VERSION = '0.1.36'

type SeedDraftFlowParams = {
    ctx: TestContext
    pieceVersion: string
}

type DraftFlow = {
    flow: Flow
    draftVersion: FlowVersion
}

type SeedPublishedFlowParams = {
    ctx: TestContext
    pieceVersion: string
}

type PublishedFlow = {
    flow: Flow
    publishedVersion: FlowVersion
}

type SeedPublishedFlowWithDraftParams = {
    ctx: TestContext
    publishedPieceVersion: string
    draftPieceVersion: string
}

type PublishedFlowWithDraft = DraftFlow & {
    publishedVersion: FlowVersion
}

type SaveVersionParams = {
    flowId: string
    state: FlowVersionState
    pieceVersion: string
    created: Dayjs
}

type PostAdminFlowsEndpointParams = {
    route: string
    body: Record<string, unknown>
}

type SeedUpgradeAuditEventParams = {
    ctx: TestContext
    flowId: string
    flowVersionId: string
}
