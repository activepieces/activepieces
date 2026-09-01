import { apId } from '@activepieces/core-utils'
import { CodeAction, FlowAction, FlowActionType, FlowStatus, flowStructureUtil, FlowTrigger, FlowTriggerType, FlowVersion, FlowVersionState } from '@activepieces/shared'
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

function getCodeStep(flowVersion: FlowVersion): CodeAction | undefined {
    return flowStructureUtil.getAllSteps(flowVersion.trigger)
        .find((step): step is CodeAction => step.type === FlowActionType.CODE)
}

async function postMigrateToDeno(body: Record<string, unknown>, apiKey = 'api-key') {
    return app!.inject({
        method: 'POST',
        url: '/api/v1/admin/flows/migrate-to-deno',
        headers: {
            'api-key': apiKey,
        },
        body,
    })
}

describe('POST /v1/admin/flows/migrate-to-deno', () => {
    it('sets useDeno on code steps of both draft and published versions when targeted by flowIds', async () => {
        const ctx = await createTestContext(app!)
        const { flow, draftVersion, publishedVersion } = await setupFlowWithDraftAndPublishedVersions(ctx)

        const response = await postMigrateToDeno({ flowIds: [flow.id] })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()).toEqual({ flowsProcessed: 1, flowVersionsMigrated: 2 })

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
        expect(response.json()).toEqual({ flowsProcessed: 1, flowVersionsMigrated: 2 })

        const migratedVersion = await db.findOneByOrFail<FlowVersion>('flow_version', { id: draftVersion.id })
        expect(getCodeStep(migratedVersion)?.settings.useDeno).toBe(true)

        const untouchedVersion = await db.findOneByOrFail<FlowVersion>('flow_version', { id: otherDraftVersion.id })
        expect(getCodeStep(untouchedVersion)?.settings.useDeno).toBeUndefined()
    })

    it('is idempotent: a second run reports zero migrated versions', async () => {
        const ctx = await createTestContext(app!)
        const { flow } = await setupFlowWithDraftAndPublishedVersions(ctx)

        await postMigrateToDeno({ flowIds: [flow.id] })
        const secondResponse = await postMigrateToDeno({ flowIds: [flow.id] })

        expect(secondResponse.statusCode).toBe(StatusCodes.OK)
        expect(secondResponse.json()).toEqual({ flowsProcessed: 1, flowVersionsMigrated: 0 })
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
