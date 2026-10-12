import { apId } from '@activepieces/core-utils'
import { DefaultProjectRole, ErrorCode, FlowActionType, FlowAction, FlowOperationType, FlowStatus, FlowTriggerType, FlowVersionState, PackageType, PieceSelectionMode, PieceSet, PieceType, RequiredActionsMode } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import { createMockConnection, createMockFlow, createMockFlowVersion, createMockPieceMetadata, createMockProject } from '../../../helpers/mocks'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const CRM = '@activepieces/piece-required-crm'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function saveCrmPiece(): Promise<void> {
    await db.save('piece_metadata', createMockPieceMetadata({
        name: CRM,
        version: '0.0.1',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        actions: {
            create_deal: { name: 'create_deal', displayName: 'Create deal', description: '', props: {}, requireAuth: false },
            update_contact: { name: 'update_contact', displayName: 'Update contact', description: '', props: {}, requireAuth: false },
            ask_agent: { name: 'ask_agent', displayName: 'Ask agent', description: '', props: {}, requireAuth: false, audience: 'ai' },
        },
    }))
}

async function createSetWithRule({ ctx, actions, mode = RequiredActionsMode.ANY }: { ctx: TestContext, actions: Record<string, string[]>, mode?: RequiredActionsMode }): Promise<PieceSet> {
    const set = (await ctx.post('/v1/piece-sets', { name: `Set ${apId()}` })).json<PieceSet>()
    await ctx.post(`/v1/piece-sets/${set.id}`, { requiredActions: { mode, actions } })
    await ctx.post(`/v1/piece-sets/${set.id}/projects`, { projectIds: [ctx.project.id] })
    return set
}

function crmStep({ name, actionName, skip }: { name: string, actionName: string, skip?: boolean }): FlowAction {
    return {
        name,
        type: FlowActionType.PIECE,
        valid: true,
        displayName: name,
        skip,
        lastUpdatedDate: dayjs().toISOString(),
        settings: {
            pieceName: CRM,
            pieceVersion: '0.0.1',
            actionName,
            input: {},
            propertySettings: {},
            errorHandlingOptions: {},
        },
    }
}

async function saveDraftFlow({ ctx, head }: { ctx: TestContext, head?: FlowAction }): Promise<string> {
    const flow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.DISABLED })
    await db.save('flow', flow)
    await db.save('flow_version', createMockFlowVersion({
        flowId: flow.id,
        updatedBy: ctx.user.id,
        state: FlowVersionState.DRAFT,
        trigger: {
            type: FlowTriggerType.EMPTY,
            name: 'trigger',
            settings: {},
            valid: false,
            displayName: 'Select Trigger',
            lastUpdatedDate: dayjs().toISOString(),
            nextAction: head,
        },
    }))
    return flow.id
}

describe('Required actions', () => {
    describe('GET /v1/piece-sets/projects/:projectId', () => {
        it('returns the Default Set with an empty rule for a project with no set', async () => {
            const ctx = await createTestContext(app!, { plan: { managePiecesEnabled: true } })
            const response = await ctx.get(`/v1/piece-sets/projects/${ctx.project.id}`)
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json<PieceSet>()
            expect(body.isDefault).toBe(true)
            expect(body.config.requiredActions).toEqual({ mode: RequiredActionsMode.ANY, actions: {} })
        })

        it('returns the assigned set to a project member', async () => {
            const ctx = await createTestContext(app!, { plan: { managePiecesEnabled: true } })
            await saveCrmPiece()
            const set = await createSetWithRule({ ctx, actions: { [CRM]: ['create_deal'] } })
            const member = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.VIEWER })
            const response = await member.get(`/v1/piece-sets/projects/${ctx.project.id}`)
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json<PieceSet>().id).toBe(set.id)
        })

        it('refuses a member of another project', async () => {
            const ctx = await createTestContext(app!, { plan: { managePiecesEnabled: true } })
            const member = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.VIEWER })
            const otherProject = createMockProject({ platformId: ctx.platform.id, ownerId: ctx.user.id })
            await db.save('project', otherProject)
            const response = await member.get(`/v1/piece-sets/projects/${otherProject.id}`)
            expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('Save rules', () => {
        it('rejects requiring an action the set excludes', async () => {
            const ctx = await createTestContext(app!, { plan: { managePiecesEnabled: true } })
            const set = (await ctx.post('/v1/piece-sets', { name: 'Excluded' })).json<PieceSet>()
            await ctx.post(`/v1/piece-sets/${set.id}`, { actions: { [CRM]: { mode: 'selected', selected: ['update_contact'] } } })
            const response = await ctx.post(`/v1/piece-sets/${set.id}`, { requiredActions: { actions: { [CRM]: ['create_deal'] } } })
            expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        })

        it('removes a required action when the same piece is excluded', async () => {
            const ctx = await createTestContext(app!, { plan: { managePiecesEnabled: true } })
            const set = (await ctx.post('/v1/piece-sets', { name: 'Prune' })).json<PieceSet>()
            await ctx.post(`/v1/piece-sets/${set.id}`, { requiredActions: { actions: { [CRM]: ['create_deal'] } } })
            const response = await ctx.post(`/v1/piece-sets/${set.id}`, { pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: [CRM] } })
            expect(response.json<PieceSet>().config.requiredActions.actions).toEqual({})
        })
    })

    describe('Publish', () => {
        it('rejects a flow without the required action', async () => {
            const ctx = await createTestContext(app!, { plan: { managePiecesEnabled: true } })
            await saveCrmPiece()
            await createSetWithRule({ ctx, actions: { [CRM]: ['create_deal'] } })
            const flowId = await saveDraftFlow({ ctx })
            const response = await ctx.post(`/v1/flows/${flowId}`, { type: FlowOperationType.LOCK_AND_PUBLISH, request: {} })
            expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
            const body = response.json()
            expect(body.code).toBe(ErrorCode.REQUIRED_ACTIONS_MISSING)
            expect(body.params.missingActions).toEqual({ [CRM]: ['create_deal'] })
            expect(typeof body.params.message).toBe('string')
        })

        it('rejects a flow whose required step is skipped', async () => {
            const ctx = await createTestContext(app!, { plan: { managePiecesEnabled: true } })
            await saveCrmPiece()
            await createSetWithRule({ ctx, actions: { [CRM]: ['create_deal'] } })
            const flowId = await saveDraftFlow({ ctx, head: crmStep({ name: 'step_1', actionName: 'create_deal', skip: true }) })
            const response = await ctx.post(`/v1/flows/${flowId}`, { type: FlowOperationType.LOCK_AND_PUBLISH, request: {} })
            expect(response.json().params.skippedActions).toEqual({ [CRM]: ['create_deal'] })
        })

        it('does not block a flow that has the required action', async () => {
            const ctx = await createTestContext(app!, { plan: { managePiecesEnabled: true } })
            await saveCrmPiece()
            await createSetWithRule({ ctx, actions: { [CRM]: ['create_deal'] } })
            const flowId = await saveDraftFlow({ ctx, head: crmStep({ name: 'step_1', actionName: 'create_deal' }) })
            const response = await ctx.post(`/v1/flows/${flowId}`, { type: FlowOperationType.LOCK_AND_PUBLISH, request: {} })
            expect(response.json().code).not.toBe(ErrorCode.REQUIRED_ACTIONS_MISSING)
        })

        it('ignores a required action that is not in the latest piece version', async () => {
            const ctx = await createTestContext(app!, { plan: { managePiecesEnabled: true } })
            await saveCrmPiece()
            const set = await createSetWithRule({ ctx, actions: { [CRM]: ['create_deal'] } })
            await db.save('piece_set', { ...set, config: { ...set.config, requiredActions: { mode: RequiredActionsMode.ANY, actions: { [CRM]: ['log_call'] } } } })
            const flowId = await saveDraftFlow({ ctx })
            const response = await ctx.post(`/v1/flows/${flowId}`, { type: FlowOperationType.LOCK_AND_PUBLISH, request: {} })
            expect(response.json().code).not.toBe(ErrorCode.REQUIRED_ACTIONS_MISSING)
        })

        it('ignores a required action that only AI agents can use', async () => {
            const ctx = await createTestContext(app!, { plan: { managePiecesEnabled: true } })
            await saveCrmPiece()
            await createSetWithRule({ ctx, actions: { [CRM]: ['ask_agent'] } })
            const flowId = await saveDraftFlow({ ctx })
            const response = await ctx.post(`/v1/flows/${flowId}`, { type: FlowOperationType.LOCK_AND_PUBLISH, request: {} })
            expect(response.json().code).not.toBe(ErrorCode.REQUIRED_ACTIONS_MISSING)
        })

        it('does not check when the plan has no Manage pieces', async () => {
            const ctx = await createTestContext(app!, { plan: { managePiecesEnabled: false } })
            await saveCrmPiece()
            await db.save('piece_set', {
                id: apId(),
                platformId: ctx.platform.id,
                name: 'Default',
                key: 'default',
                isDefault: true,
                generatedForProjectId: null,
                config: {
                    pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: [] },
                    selectedActions: {},
                    selectedTriggers: {},
                    requiredActions: { mode: RequiredActionsMode.ANY, actions: { [CRM]: ['create_deal'] } },
                },
            })
            const flowId = await saveDraftFlow({ ctx })
            const response = await ctx.post(`/v1/flows/${flowId}`, { type: FlowOperationType.LOCK_AND_PUBLISH, request: {} })
            expect(response.json().code).not.toBe(ErrorCode.REQUIRED_ACTIONS_MISSING)
        })
    })

    describe('Connection replace', () => {
        it('does not refuse the replace when a republished flow misses a required action', async () => {
            const ctx = await createTestContext(app!, { plan: { managePiecesEnabled: true } })
            await saveCrmPiece()
            await createSetWithRule({ ctx, actions: { [CRM]: ['create_deal'] } })
            const source = createMockConnection({ platformId: ctx.platform.id, projectIds: [ctx.project.id], pieceName: CRM }, ctx.user.id)
            const target = createMockConnection({ platformId: ctx.platform.id, projectIds: [ctx.project.id], pieceName: CRM }, ctx.user.id)
            await db.save('app_connection', [source, target])
            const flow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.DISABLED })
            await db.save('flow', flow)
            const publishedVersion = createMockFlowVersion({
                flowId: flow.id,
                displayName: 'Deal sync',
                state: FlowVersionState.LOCKED,
                connectionIds: [source.externalId],
            })
            await db.save('flow_version', publishedVersion)
            await db.update('flow', flow.id, { publishedVersionId: publishedVersion.id })

            const response = await ctx.post('/v1/app-connections/replace', {
                sourceAppConnectionId: source.id,
                targetAppConnectionId: target.id,
                projectId: ctx.project.id,
                applyToPublishedVersions: true,
            })

            expect(response.statusCode).toBe(StatusCodes.NO_CONTENT)
        })
    })
})
