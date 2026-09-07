import { apId } from '@activepieces/core-utils'
import { CodeAction, Flow, FlowAction, FlowActionType, FlowStatus, flowStructureUtil, FlowTrigger, FlowTriggerType, FlowVersion, FlowVersionState } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
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

function buildTriggerWithCodeStep(): FlowTrigger {
    const codeStep: FlowAction = {
        type: FlowActionType.CODE,
        name: 'step_1',
        displayName: 'Code',
        valid: true,
        settings: {
            sourceCode: {
                code: 'export const code = async () => { return {} }',
                packageJson: '{}',
            },
            input: {},
            errorHandlingOptions: {},
        },
    }
    return {
        type: FlowTriggerType.EMPTY,
        name: 'trigger',
        settings: {},
        valid: false,
        displayName: 'Select Trigger',
        nextAction: codeStep,
    }
}

async function setupFlowWithDraftAndPublishedVersions(ctx: TestContext) {
    const flowId = apId()
    const publishedVersion = createMockFlowVersion({
        flowId,
        state: FlowVersionState.LOCKED,
        trigger: buildTriggerWithCodeStep(),
        created: dayjs().subtract(1, 'hour').toISOString(),
    })
    const draftVersion = createMockFlowVersion({
        flowId,
        state: FlowVersionState.DRAFT,
        trigger: buildTriggerWithCodeStep(),
        created: dayjs().toISOString(),
    })
    const flow = createMockFlow({
        id: flowId,
        projectId: ctx.project.id,
        status: FlowStatus.ENABLED,
        publishedVersionId: null,
    })
    await db.save('flow', flow)
    await db.save('flow_version', publishedVersion)
    await db.save('flow_version', draftVersion)
    flow.publishedVersionId = publishedVersion.id
    await db.save('flow', flow)
    return { flow, draftVersion, publishedVersion }
}

async function setupFlowWithPublishedLatestVersion(ctx: TestContext) {
    const flowId = apId()
    const publishedVersion = createMockFlowVersion({
        flowId,
        state: FlowVersionState.LOCKED,
        trigger: buildTriggerWithCodeStep(),
        created: dayjs().toISOString(),
    })
    const flow = createMockFlow({
        id: flowId,
        projectId: ctx.project.id,
        status: FlowStatus.DISABLED,
        publishedVersionId: null,
    })
    await db.save('flow', flow)
    await db.save('flow_version', publishedVersion)
    flow.publishedVersionId = publishedVersion.id
    await db.save('flow', flow)
    return { flow, publishedVersion }
}

function getCodeStep(flowVersion: FlowVersion): CodeAction | undefined {

    return flowStructureUtil.getAllSteps(flowVersion.trigger)
        .find((step): step is CodeAction => step.type === FlowActionType.CODE)
}

async function postAdminFlowsEndpoint(route: string, body: Record<string, unknown>, apiKey = 'api-key') {
    return app!.inject({
        method: 'POST',
        url: `/api/v1/admin/flows/${route}`,
        headers: {
            'api-key': apiKey,
        },
        body,
    })
}

async function postMigrateToDeno(body: Record<string, unknown>, apiKey = 'api-key') {
    return postAdminFlowsEndpoint('migrate-to-deno', body, apiKey)
}

async function postRevertFromDeno(body: Record<string, unknown>) {
    return postAdminFlowsEndpoint('revert-from-deno', body)
}

describe('POST /v1/admin/flows/migrate-to-deno', () => {
    it('sets useDeno on code steps of both draft and published versions when targeted by flowIds', async () => {
        const ctx = await createTestContext(app!)
        const { flow, draftVersion, publishedVersion } = await setupFlowWithDraftAndPublishedVersions(ctx)

        const response = await postMigrateToDeno({ flowIds: [flow.id] })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()).toEqual({ flowsProcessed: 1, republishedFlows: 0, flowVersionsMigrated: 2, staleFlows: 1 })

        for (const versionId of [draftVersion.id, publishedVersion.id]) {
            const savedVersion = await db.findOneByOrFail<FlowVersion>('flow_version', { id: versionId })
            expect(getCodeStep(savedVersion)?.settings.useDeno).toBe(true)
            expect(savedVersion.trigger.type).toBe(FlowTriggerType.EMPTY)
        }
    })

    it('migrates all flows of a project when targeted by projectId and skips other projects', async () => {
        const ctx = await createTestContext(app!)
        const otherCtx = await createTestContext(app!)
        const { draftVersion } = await setupFlowWithDraftAndPublishedVersions(ctx)
        const { draftVersion: otherDraftVersion } = await setupFlowWithDraftAndPublishedVersions(otherCtx)

        const response = await postMigrateToDeno({ projectId: ctx.project.id })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()).toEqual({ flowsProcessed: 1, republishedFlows: 0, flowVersionsMigrated: 2, staleFlows: 1 })

        const migratedVersion = await db.findOneByOrFail<FlowVersion>('flow_version', { id: draftVersion.id })
        expect(getCodeStep(migratedVersion)?.settings.useDeno).toBe(true)

        const untouchedVersion = await db.findOneByOrFail<FlowVersion>('flow_version', { id: otherDraftVersion.id })
        expect(getCodeStep(untouchedVersion)?.settings.useDeno).toBeUndefined()
    })

    it('republishes a flow whose published version is the latest, so workers pick a new version id', async () => {
        const ctx = await createTestContext(app!)
        const { flow, publishedVersion } = await setupFlowWithPublishedLatestVersion(ctx)

        const response = await postMigrateToDeno({ flowIds: [flow.id] })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()).toEqual({ flowsProcessed: 1, republishedFlows: 1, flowVersionsMigrated: 0, staleFlows: 0 })

        const savedFlow = await db.findOneByOrFail<Flow>('flow', { id: flow.id })
        expect(savedFlow.publishedVersionId).not.toBe(publishedVersion.id)
        expect(savedFlow.status).toBe(FlowStatus.DISABLED)

        const newPublishedVersion = await db.findOneByOrFail<FlowVersion>('flow_version', { id: savedFlow.publishedVersionId })
        expect(newPublishedVersion.state).toBe(FlowVersionState.LOCKED)
        expect(getCodeStep(newPublishedVersion)?.settings.useDeno).toBe(true)

        const oldVersion = await db.findOneByOrFail<FlowVersion>('flow_version', { id: publishedVersion.id })
        expect(getCodeStep(oldVersion)?.settings.useDeno).toBeUndefined()
    })

    it('reverts a migrated flow back to the legacy sandbox via revert-from-deno', async () => {
        const ctx = await createTestContext(app!)
        const { flow } = await setupFlowWithPublishedLatestVersion(ctx)

        await postMigrateToDeno({ flowIds: [flow.id] })
        const revertResponse = await postRevertFromDeno({ flowIds: [flow.id] })

        expect(revertResponse.statusCode).toBe(StatusCodes.OK)
        expect(revertResponse.json()).toEqual({ flowsProcessed: 1, republishedFlows: 1, flowVersionsMigrated: 0, staleFlows: 0 })

        const savedFlow = await db.findOneByOrFail<Flow>('flow', { id: flow.id })
        const revertedVersion = await db.findOneByOrFail<FlowVersion>('flow_version', { id: savedFlow.publishedVersionId })
        expect(revertedVersion.state).toBe(FlowVersionState.LOCKED)
        expect(getCodeStep(revertedVersion)?.settings.useDeno).toBe(false)

        const secondRevert = await postRevertFromDeno({ flowIds: [flow.id] })
        expect(secondRevert.json()).toEqual({ flowsProcessed: 1, republishedFlows: 0, flowVersionsMigrated: 0, staleFlows: 0 })
    })

    it('is idempotent: a second run reports zero migrated versions', async () => {
        const ctx = await createTestContext(app!)
        const { flow } = await setupFlowWithDraftAndPublishedVersions(ctx)

        await postMigrateToDeno({ flowIds: [flow.id] })
        const secondResponse = await postMigrateToDeno({ flowIds: [flow.id] })

        expect(secondResponse.statusCode).toBe(StatusCodes.OK)
        expect(secondResponse.json()).toEqual({ flowsProcessed: 1, republishedFlows: 0, flowVersionsMigrated: 0, staleFlows: 0 })
    })

    it('rejects a body without exactly one selector', async () => {
        const emptyBodyResponse = await postMigrateToDeno({})
        expect(emptyBodyResponse.statusCode).toBe(StatusCodes.BAD_REQUEST)

        const twoSelectorsResponse = await postMigrateToDeno({ projectId: apId(), flowIds: [apId()] })
        expect(twoSelectorsResponse.statusCode).toBe(StatusCodes.BAD_REQUEST)
    })

    it('rejects a wrong api key', async () => {
        const response = await postMigrateToDeno({ flowIds: [apId()] }, 'wrong-key')
        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
    })
})
