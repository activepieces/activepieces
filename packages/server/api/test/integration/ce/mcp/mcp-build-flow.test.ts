import { apId } from '@activepieces/core-utils'
import { EngineResponseStatus, FlowActionType, flowStructureUtil, FlowTrigger, McpServerType, PackageType, PieceType, ProjectScopedMcpServer, StepLocationRelativeToParent } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { flowService } from '../../../../src/app/flows/flow/flow.service'
import { apAddStepTool } from '../../../../src/app/mcp/tools/ap-add-step'
import { apApplyFlowOperationsTool } from '../../../../src/app/mcp/tools/ap-apply-flow-operations'
import { apBuildFlowTool } from '../../../../src/app/mcp/tools/ap-build-flow'
import { apCreateFlowTool } from '../../../../src/app/mcp/tools/ap-create-flow'
import { userInteractionWatcher } from '../../../../src/app/workers/user-interaction-watcher'
import { db } from '../../../helpers/db'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app.log
    await db.save('piece_metadata', createMockPieceMetadata({
        name: '@activepieces/piece-test-labels',
        displayName: 'Test Labels',
        version: '0.1.0',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        platformId: undefined,
        actions: {
            post: {
                name: 'post',
                displayName: 'Post',
                description: 'Post a message',
                requireAuth: false,
                props: {
                    channel: { type: 'DROPDOWN', displayName: 'Channel', required: true, refreshers: [] },
                    mode: { type: 'STATIC_DROPDOWN', displayName: 'Mode', required: true, options: { options: [{ label: 'Fast mode', value: 'fast' }, { label: 'Slow mode', value: 'slow' }] } },
                    tag: { type: 'STATIC_DROPDOWN', displayName: 'Tag', required: false, options: { options: [{ label: 'Sales EU', value: 's_eu' }, { label: 'Sales US', value: 's_us' }] } },
                    text: { type: 'SHORT_TEXT', displayName: 'Text', required: true },
                },
            },
        },
        triggers: {
            on_event: { name: 'on_event', displayName: 'On Event', description: 'On event', requireAuth: false, props: {} },
        },
    }))
    await db.save('piece_metadata', createMockPieceMetadata({
        name: '@activepieces/piece-test-mail',
        displayName: 'Test Mail',
        version: '0.1.0',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        platformId: undefined,
        actions: {
            label_email: {
                name: 'label_email',
                displayName: 'Label Email',
                description: 'Add a label',
                requireAuth: false,
                props: {
                    label: { type: 'DROPDOWN', displayName: 'Label', required: true, refreshers: [] },
                    cc: { type: 'ARRAY', displayName: 'CC', required: false },
                    note: { type: 'SHORT_TEXT', displayName: 'Note', required: false },
                },
            },
        },
        triggers: {
            new_email: { name: 'new_email', displayName: 'New Email', description: 'New email', requireAuth: false, props: {} },
        },
    }))
    await db.save('piece_metadata', createMockPieceMetadata({
        name: '@activepieces/piece-test-batch',
        displayName: 'Test Batch',
        version: '0.1.0',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        platformId: undefined,
        actions: {
            send_message: {
                name: 'send_message',
                displayName: 'Send Message',
                description: 'Send a message',
                requireAuth: false,
                props: {
                    channel: { type: 'SHORT_TEXT', displayName: 'Channel', required: true },
                },
            },
        },
        triggers: {},
    }))
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('ap_build_flow inline review', () => {
    it('replaces clear dropdown labels by their values and reports every remaining problem by step and field', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const resolve = vi.spyOn(userInteractionWatcher, 'submitAndWaitForResponse').mockResolvedValue({ status: EngineResponseStatus.OK, response: { options: [{ label: '#general', value: 'C1' }, { label: '#random', value: 'C2' }] } })

        const result = await apBuildFlowTool({ mcp }, mockLog).execute({
            flowName: 'Labels',
            trigger: { pieceName: '@activepieces/piece-test-labels', triggerName: 'on_event' },
            steps: [{ type: FlowActionType.PIECE, displayName: 'Post', pieceName: '@activepieces/piece-test-labels', actionName: 'post', input: { channel: '#general', mode: 'Fast mode', tag: 'Sales' } }],
        })
        resolve.mockRestore()
        const { flowId, problems } = reviewSchema.parse(result.structuredContent)
        const flow = await flowService(mockLog).getOnePopulatedOrThrow({ id: flowId, projectId: ctx.project.id })
        const output = text(result)

        expect(flowStructureUtil.getStepOrThrow('step_1', flow.version.trigger).settings.input).toMatchObject({ channel: 'C1', mode: 'fast', tag: 'Sales' })
        expect(output).toContain('step_1 "Post": test-labels/post, after trigger')
        expect(output).toContain('step_1.channel: "#general" → "C1"')
        expect(output).toContain('step_1.tag: "Sales" matches several options')
        expect(output).toContain('step_1.text: required')
        expect(problems.map((problem) => problem.text)).toEqual(expect.arrayContaining([expect.stringContaining('step_1.tag:'), 'step_1.text: required']))
        expect(problems.some((problem) => problem.field === 'mode' || problem.field === 'channel')).toBe(false)
    })

    it('fetches no options for values that already are option values or references, and says all is checked', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const resolve = vi.spyOn(userInteractionWatcher, 'submitAndWaitForResponse')

        const result = await apBuildFlowTool({ mcp }, mockLog).execute({
            flowName: 'Values',
            trigger: { pieceName: '@activepieces/piece-test-labels', triggerName: 'on_event' },
            steps: [{ type: FlowActionType.PIECE, displayName: 'Post', pieceName: '@activepieces/piece-test-labels', actionName: 'post', input: { channel: '{{trigger[\'output\'].channel}}', mode: 'slow', text: 'hi' } }],
        })
        const calls = resolve.mock.calls.length
        resolve.mockRestore()

        expect(calls).toBe(0)
        expect(text(result)).toContain('✅')
        expect(reviewSchema.parse(result.structuredContent).problems).toEqual([])
    })

    it('reports a reference to a step that does not exist and an unmatched static label with its options', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)

        const result = await apBuildFlowTool({ mcp }, mockLog).execute({
            flowName: 'Broken refs',
            trigger: { pieceName: '@activepieces/piece-test-labels', triggerName: 'on_event' },
            steps: [
                { type: FlowActionType.CODE, displayName: 'Compute', sourceCode: 'export const code = async () => ({});', input: { x: '{{step_9.y}}' } },
                { type: FlowActionType.PIECE, displayName: 'Post', pieceName: '@activepieces/piece-test-labels', actionName: 'post', input: { channel: '{{trigger[\'output\'].channel}}', mode: 'Turbo', text: 'hi' } },
            ],
        })
        const output = text(result)

        expect(output).toContain('⚠️')
        expect(output).toMatch(/step_1: .*step_9/)
        expect(output).toContain('step_2.mode: "Turbo" matches no option; options: "Fast mode"="fast", "Slow mode"="slow"')
    })
})

describe('ap_build_flow regressions from real chats', () => {
    beforeEach(() => {
        vi.spyOn(userInteractionWatcher, 'submitAndWaitForResponse').mockResolvedValue({ status: EngineResponseStatus.OK, response: { options: LABEL_OPTIONS } })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('fills optional list fields and takes an object-valued option by its id or as a JSON string', async () => {
        const ctx = await createTestContext(app)
        const result = await apBuildFlowTool({ mcp: makeMcp(ctx.project.id) }, mockLog).execute({
            flowName: 'Triage',
            trigger: { pieceName: MAIL, triggerName: 'new_email' },
            steps: [
                { type: FlowActionType.PIECE, displayName: 'Label by id', pieceName: MAIL, actionName: 'label_email', input: { label: 'Label_2' } },
                { type: FlowActionType.PIECE, displayName: 'Label by JSON', pieceName: MAIL, actionName: 'label_email', input: { label: '{"id":"Label_13","name":"Input/Notification"}' } },
            ],
        })
        const { flowId, problems } = reviewSchema.parse(result.structuredContent)
        const trigger = (await flowService(mockLog).getOnePopulatedOrThrow({ id: flowId, projectId: ctx.project.id })).version.trigger

        expect(flowStructureUtil.getStepOrThrow('step_1', trigger).settings.input).toMatchObject({ cc: [], label: { id: 'Label_2', name: 'Input/To Respond' } })
        expect(flowStructureUtil.getStepOrThrow('step_2', trigger).settings.input).toMatchObject({ label: { id: 'Label_13', name: 'Input/Notification' } })
        expect(problems).toEqual([])
    })

    it('names a clashing fallback "Otherwise" and puts INSIDE_BRANCH steps without branchIndex in the first empty branch', async () => {
        const ctx = await createTestContext(app)
        const result = await apBuildFlowTool({ mcp: makeMcp(ctx.project.id) }, mockLog).execute({
            flowName: 'Router',
            trigger: { pieceName: MAIL, triggerName: 'new_email' },
            steps: [
                routerStep({ fallbackBranchName: 'Low' }),
                { type: FlowActionType.PIECE, displayName: 'Urgent label', pieceName: MAIL, actionName: 'label_email', input: { label: 'Label_2' }, parentStepName: 'Route', stepLocationRelativeToParent: 'INSIDE_BRANCH' },
                { type: FlowActionType.PIECE, displayName: 'Low label', pieceName: MAIL, actionName: 'label_email', input: { label: 'Label_13' }, parentStepName: 'Route', stepLocationRelativeToParent: 'INSIDE_BRANCH' },
            ],
        })
        const output = text(result)

        expect(output).toContain('router [Urgent | Low | Otherwise]')
        expect(output).toContain('first in step_1 branch "Urgent"')
        expect(output).toContain('first in step_1 branch "Low"')
    })

    it('skips a step whose parent was skipped instead of attaching it elsewhere', async () => {
        const ctx = await createTestContext(app)
        const result = await apBuildFlowTool({ mcp: makeMcp(ctx.project.id) }, mockLog).execute({
            flowName: 'Skips',
            trigger: { pieceName: MAIL, triggerName: 'new_email' },
            steps: [
                routerStep({}),
                { type: FlowActionType.PIECE, displayName: 'Bad branch', pieceName: MAIL, actionName: 'label_email', input: { label: 'Label_2' }, parentStepName: 'Route', stepLocationRelativeToParent: 'INSIDE_BRANCH', branchIndex: 9 },
                { type: FlowActionType.PIECE, displayName: 'After bad', pieceName: MAIL, actionName: 'label_email', input: { label: 'Label_2' }, parentStepName: 'Bad branch' },
            ],
        })
        const output = text(result)

        expect(output).toContain('After bad (its parent "Bad branch" was skipped')
        expect(output).not.toContain('"After bad"')
    })
})

describe('ap_apply_flow_operations regressions', () => {
    beforeEach(() => {
        vi.spyOn(userInteractionWatcher, 'submitAndWaitForResponse').mockResolvedValue({ status: EngineResponseStatus.OK, response: { options: LABEL_OPTIONS } })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('deletes a branch named by branchName and adds a step without stepType', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const built = await apBuildFlowTool({ mcp }, mockLog).execute({
            flowName: 'Edit me',
            trigger: { pieceName: MAIL, triggerName: 'new_email' },
            steps: [routerStep({})],
        })
        const { flowId } = reviewSchema.parse(built.structuredContent)

        const result = await apApplyFlowOperationsTool({ mcp }, mockLog).execute({
            flowId,
            operations: [
                { type: 'delete_branch', branchName: 'urgent' },
                { type: 'add_step', displayName: 'Label it', pieceName: MAIL, actionName: 'label_email', input: { label: 'Input/To Respond' }, parentStepName: 'step_1', stepLocationRelativeToParent: 'AFTER' },
            ],
        })
        const trigger = (await flowService(mockLog).getOnePopulatedOrThrow({ id: flowId, projectId: ctx.project.id })).version.trigger
        const router = flowStructureUtil.getStepOrThrow('step_1', trigger)

        expect(text(result)).toContain('✅ Applied 2 operation(s)')
        expect(router.type === FlowActionType.ROUTER ? router.settings.branches.map((branch) => branch.branchName) : []).toEqual(['Low', 'Otherwise'])
        expect(flowStructureUtil.getStepOrThrow('step_2', trigger).settings.input).toMatchObject({ cc: [], label: { id: 'Label_2' } })
    })
})

describe('ap_apply_flow_operations', () => {
    it('applies several operations in order and reports remaining problems by step and field', async () => {
        const { mcp, projectId, flowId } = await setupFlowWithCodeStep()

        const result = await apApplyFlowOperationsTool({ mcp }, mockLog).execute({
            flowId,
            operations: [
                { type: 'update_step', stepName: 'step_1', displayName: 'Renamed Code' },
                { type: 'add_step', parentStepName: 'step_1', stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER, stepType: FlowActionType.PIECE, displayName: 'Send', pieceName: '@activepieces/piece-test-batch', actionName: 'send_message' },
                { type: 'add_step', parentStepName: 'step_2', stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER, stepType: FlowActionType.CODE, displayName: 'Last Code' },
            ],
        })

        expect(text(result)).toContain('✅ Applied 3 operation(s)')
        const { applied, problems } = appliedSchema.parse(result.structuredContent)
        expect(applied.map(a => a.type)).toEqual(['update_step', 'add_step', 'add_step'])
        expect(problems.step_2).toEqual(['channel is missing'])

        const trigger = await draftTrigger({ flowId, projectId })
        expect(flowStructureUtil.getStep('step_1', trigger)?.displayName).toBe('Renamed Code')
        expect(flowStructureUtil.getAllSteps(trigger).map(s => s.name)).toEqual(['trigger', 'step_1', 'step_2', 'step_3'])
    })

    it('rolls the draft back and names the failing operation when the second one fails', async () => {
        const { mcp, projectId, flowId } = await setupFlowWithCodeStep()
        const before = await draftTrigger({ flowId, projectId })

        const result = await apApplyFlowOperationsTool({ mcp }, mockLog).execute({
            flowId,
            operations: [
                { type: 'update_step', stepName: 'step_1', displayName: 'Should Not Stick' },
                { type: 'delete_step', stepName: 'step_does_not_exist' },
                { type: 'update_step', stepName: 'step_1', displayName: 'Never Applied' },
            ],
        })

        expect(result.isError).toBe(true)
        expect(text(result)).toContain('Operation 2 (delete_step) failed')
        expect(text(result)).toContain('step_does_not_exist')
        expect(failureSchema.parse(result.structuredContent)).toMatchObject({ failedOperation: { index: 1, type: 'delete_step' }, rolledBack: true })

        const after = await draftTrigger({ flowId, projectId })
        expect(flowStructureUtil.getStep('step_1', after)?.displayName).toBe('My Code')
        expect(flowStructureUtil.getAllSteps(after).map(s => s.name)).toEqual(flowStructureUtil.getAllSteps(before).map(s => s.name))
    })
})

async function setupFlowWithCodeStep(): Promise<{ mcp: ProjectScopedMcpServer, projectId: string, flowId: string }> {
    const ctx = await createTestContext(app)
    const mcp = makeMcp(ctx.project.id)
    const created = await apCreateFlowTool({ mcp }, mockLog).execute({ flowName: 'Batch Flow' })
    const match = text(created).match(/\(id: (\S+?)\)/)
    if (!match) throw new Error(`Could not extract flowId from: ${text(created)}`)
    const flowId = match[1]
    await apAddStepTool({ mcp }, mockLog).execute({
        flowId,
        parentStepName: 'trigger',
        stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
        stepType: FlowActionType.CODE,
        displayName: 'My Code',
    })
    return { mcp, projectId: ctx.project.id, flowId }
}

async function draftTrigger({ flowId, projectId }: { flowId: string, projectId: string }): Promise<FlowTrigger> {
    return (await flowService(mockLog).getOnePopulatedOrThrow({ id: flowId, projectId })).version.trigger
}

function routerStep({ fallbackBranchName }: { fallbackBranchName?: string }): Record<string, unknown> {
    return {
        type: FlowActionType.ROUTER,
        displayName: 'Route',
        branches: [
            { branchName: 'Urgent', conditions: [[{ operator: 'TEXT_EXACTLY_MATCHES', firstValue: '{{trigger.priority}}', secondValue: 'urgent' }]] },
            { branchName: 'Low', conditions: [[{ operator: 'TEXT_EXACTLY_MATCHES', firstValue: '{{trigger.priority}}', secondValue: 'low' }]] },
        ],
        ...(fallbackBranchName === undefined ? {} : { fallbackBranchName }),
    }
}

function makeMcp(projectId: string): ProjectScopedMcpServer {
    return {
        id: apId(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        projectId,
        platformId: null,
        type: McpServerType.PROJECT,
        token: apId(),
        disabledTools: null,
    }
}

function text(result: { content: Array<{ type: 'text', text: string }> }): string {
    return result.content.map((c) => c.text).join('\n')
}

const MAIL = '@activepieces/piece-test-mail'

const LABEL_OPTIONS = [
    { label: 'CHAT', value: { id: 'CHAT', name: 'CHAT', type: 'system' } },
    { label: 'Input/To Respond', value: { id: 'Label_2', name: 'Input/To Respond', type: 'user' } },
    { label: 'Input/Notification', value: { id: 'Label_13', name: 'Input/Notification', type: 'user' } },
]

const reviewSchema = z.object({
    flowId: z.string(),
    problems: z.array(z.object({ step: z.string(), field: z.string().optional(), message: z.string(), text: z.string() })),
})

const appliedSchema = z.object({
    applied: z.array(z.object({ index: z.number(), type: z.string(), result: z.string() })),
    problems: z.record(z.string(), z.array(z.string())),
})

const failureSchema = z.object({
    failedOperation: z.object({ index: z.number(), type: z.string(), reason: z.string() }),
    rolledBack: z.boolean(),
})
