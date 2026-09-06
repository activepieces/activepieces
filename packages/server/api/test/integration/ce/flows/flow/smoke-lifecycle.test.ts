import { ErrorCode } from '@activepieces/core-utils'
import {
    FLOW_VERSION_TOKEN_HEADER,
    FlowActionType,
    flowOperations,
    FlowOperationType,
    flowStructureUtil,
    FlowVersion,
    flowVersionToken,
    PopulatedFlow,
    StepLocationRelativeToParent,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { createTestContext } from '../../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const SOURCE = { packageJson: '{}', code: 'export const code = async () => ({})' }
const codeSettings = () => ({
    sourceCode: SOURCE, input: {}, inputUiInfo: {}, propertySettings: {}, errorHandlingOptions: {},
})

type Ctx = Awaited<ReturnType<typeof createTestContext>>

const names = (version: FlowVersion): string[] =>
    flowStructureUtil.getAllSteps(version.trigger).map((step) => step.name)

const duplicates = (version: FlowVersion): string[] => {
    const seen = new Map<string, number>()
    names(version).forEach((name) => seen.set(name, (seen.get(name) ?? 0) + 1))
    return [...seen.entries()].filter(([, count]) => count > 1).map(([name]) => name)
}

async function createFlow(ctx: Ctx, displayName: string): Promise<PopulatedFlow> {
    const response = await ctx.post('/v1/flows', { displayName, projectId: ctx.project.id }, { query: { projectId: ctx.project.id } })
    expect(response?.statusCode).toBe(StatusCodes.CREATED)
    return response?.json()
}

async function operate(ctx: Ctx, flowId: string, operation: unknown, token?: string) {
    return ctx.inject({
        method: 'POST',
        url: `/api/v1/flows/${flowId}`,
        ...(token ? { headers: { [FLOW_VERSION_TOKEN_HEADER]: token } } : {}),
        payload: operation as Record<string, unknown>,
    })
}

const addAction = (parentStep: string, name: string) => ({
    type: FlowOperationType.ADD_ACTION,
    request: {
        parentStep,
        stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
        action: { type: FlowActionType.CODE, name, displayName: name, valid: true, settings: codeSettings() },
    },
})

describe('flow lifecycle smoke', () => {
    it('drives create -> add -> update -> duplicate -> move -> delete -> import -> publish', async () => {
        const ctx = await createTestContext(app!)
        const flow = await createFlow(ctx, 'smoke')

        for (const [parent, name] of [['trigger', 'step_1'], ['step_1', 'step_2'], ['step_2', 'step_3']]) {
            const added = await operate(ctx, flow.id, addAction(parent, name))
            expect(added?.statusCode).toBe(StatusCodes.OK)
        }
        let current: PopulatedFlow = (await operate(ctx, flow.id, addAction('step_3', 'step_4')))?.json()
        expect(names(current.version)).toEqual(['trigger', 'step_1', 'step_2', 'step_3', 'step_4'])

        const updated = await operate(ctx, flow.id, {
            type: FlowOperationType.UPDATE_ACTION,
            request: { name: 'step_2', displayName: 'renamed step', type: FlowActionType.CODE, valid: true, settings: codeSettings() },
        })
        expect(updated?.statusCode, updated?.body?.slice(0, 300)).toBe(StatusCodes.OK)
        current = updated?.json()
        expect(flowStructureUtil.getStepOrThrow('step_2', current.version.trigger).displayName).toBe('renamed step')
        expect(names(current.version)).toHaveLength(5)

        current = (await operate(ctx, flow.id, {
            type: FlowOperationType.DUPLICATE_ACTION,
            request: { stepName: 'step_2' },
        }))?.json()
        expect(names(current.version)).toHaveLength(6)
        expect(duplicates(current.version)).toEqual([])

        current = (await operate(ctx, flow.id, {
            type: FlowOperationType.MOVE_ACTION,
            request: { name: 'step_4', newParentStep: 'step_1', stepLocationRelativeToNewParent: StepLocationRelativeToParent.AFTER },
        }))?.json()
        expect(names(current.version)).toHaveLength(6)
        expect(duplicates(current.version)).toEqual([])

        current = (await operate(ctx, flow.id, {
            type: FlowOperationType.DELETE_ACTION,
            request: { names: ['step_4'] },
        }))?.json()
        expect(names(current.version)).toHaveLength(5)

        const imported = await operate(ctx, flow.id, {
            type: FlowOperationType.IMPORT_FLOW,
            request: { displayName: 'smoke imported', trigger: current.version.trigger, notes: [] },
        })
        expect(imported?.statusCode).toBe(StatusCodes.OK)
        const afterImport: PopulatedFlow = imported?.json()
        expect(duplicates(afterImport.version)).toEqual([])
        expect(names(afterImport.version).sort()).toEqual(names(current.version).sort())
    })

    it('paste operations from a fresh snapshot allocate unique names', async () => {
        const ctx = await createTestContext(app!)
        const flow = await createFlow(ctx, 'smoke-paste')
        for (const [parent, name] of [['trigger', 'step_1'], ['step_1', 'step_2']]) {
            await operate(ctx, flow.id, addAction(parent, name))
        }
        const loaded: PopulatedFlow = (await ctx.get(`/v1/flows/${flow.id}`))?.json()

        const copied = [flowStructureUtil.getActionOrThrow('step_1', loaded.version.trigger)]
        const pasteOps = flowOperations.getOperationsForPaste(
            JSON.parse(JSON.stringify(copied)),
            loaded.version,
            { parentStepName: 'step_2', stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER },
        )

        let latest: PopulatedFlow = loaded
        for (const operation of pasteOps) {
            const response = await operate(ctx, flow.id, operation)
            expect(response?.statusCode).toBe(StatusCodes.OK)
            latest = response?.json()
        }
        expect(duplicates(latest.version)).toEqual([])
    })

    it('rejects the second of two sessions editing from the same snapshot', async () => {
        const ctx = await createTestContext(app!)
        const flow = await createFlow(ctx, 'smoke-two-sessions')
        for (const [parent, name] of [['trigger', 'step_1'], ['step_1', 'step_2'], ['step_2', 'step_3']]) {
            await operate(ctx, flow.id, addAction(parent, name))
        }

        const sessionA: PopulatedFlow = (await ctx.get(`/v1/flows/${flow.id}`))?.json()
        const sessionB: PopulatedFlow = (await ctx.get(`/v1/flows/${flow.id}`))?.json()
        const tokenA = flowVersionToken.of(sessionA.version)
        const tokenB = flowVersionToken.of(sessionB.version)
        expect(tokenB).toBe(tokenA)

        const firstPaste = await operate(ctx, flow.id, addAction('step_3', 'step_4'), tokenA)
        expect(firstPaste?.statusCode).toBe(StatusCodes.OK)

        const secondPaste = await operate(ctx, flow.id, addAction('step_2', 'step_4'), tokenB)
        expect(secondPaste?.statusCode).toBe(StatusCodes.PRECONDITION_FAILED)
        expect(secondPaste?.json().code).toBe(ErrorCode.FLOW_VERSION_CONFLICT)

        const final: PopulatedFlow = (await ctx.get(`/v1/flows/${flow.id}`))?.json()
        expect(duplicates(final.version)).toEqual([])
        expect(names(final.version)).toEqual(['trigger', 'step_1', 'step_2', 'step_3', 'step_4'])
    })

    // The in-process harness serializes injected requests, so this pins the
    // outcome rather than the distributed lock that enforces it across processes.
    it('applies only one of two operations sharing a token', async () => {
        const ctx = await createTestContext(app!)
        const flow = await createFlow(ctx, 'smoke-simultaneous')
        await operate(ctx, flow.id, addAction('trigger', 'step_1'))

        const loaded: PopulatedFlow = (await ctx.get(`/v1/flows/${flow.id}`))?.json()
        const token = flowVersionToken.of(loaded.version)

        const [first, second] = await Promise.all([
            operate(ctx, flow.id, addAction('step_1', 'step_2'), token),
            operate(ctx, flow.id, addAction('step_1', 'step_2'), token),
        ])

        const statuses = [first?.statusCode, second?.statusCode].sort()
        expect(statuses).toEqual([StatusCodes.OK, StatusCodes.PRECONDITION_FAILED])

        const final: PopulatedFlow = (await ctx.get(`/v1/flows/${flow.id}`))?.json()
        expect(duplicates(final.version)).toEqual([])
        expect(names(final.version)).toEqual(['trigger', 'step_1', 'step_2'])
    })

    it('lets a session continue once it reloads after a conflict', async () => {
        const ctx = await createTestContext(app!)
        const flow = await createFlow(ctx, 'smoke-recover')
        await operate(ctx, flow.id, addAction('trigger', 'step_1'))

        const stale: PopulatedFlow = (await ctx.get(`/v1/flows/${flow.id}`))?.json()
        await operate(ctx, flow.id, addAction('step_1', 'step_2'))

        const conflicted = await operate(ctx, flow.id, addAction('step_1', 'step_3'), flowVersionToken.of(stale.version))
        expect(conflicted?.statusCode).toBe(StatusCodes.PRECONDITION_FAILED)

        const reloaded: PopulatedFlow = (await ctx.get(`/v1/flows/${flow.id}`))?.json()
        const retried = await operate(ctx, flow.id, addAction('step_2', 'step_3'), flowVersionToken.of(reloaded.version))
        expect(retried?.statusCode).toBe(StatusCodes.OK)
        expect(names(retried?.json().version)).toEqual(['trigger', 'step_1', 'step_2', 'step_3'])
    })

    it('keeps a long single-session edit run free of false conflicts', async () => {
        const ctx = await createTestContext(app!)
        const flow = await createFlow(ctx, 'smoke-long-session')

        let latest: PopulatedFlow = (await ctx.get(`/v1/flows/${flow.id}`))?.json()
        let parent = 'trigger'
        for (let i = 1; i <= 12; i++) {
            const response = await operate(ctx, flow.id, addAction(parent, `step_${i}`), flowVersionToken.of(latest.version))
            expect(response?.statusCode).toBe(StatusCodes.OK)
            latest = response?.json()
            parent = `step_${i}`
        }
        expect(names(latest.version)).toHaveLength(13)
        expect(duplicates(latest.version)).toEqual([])
    })
})
