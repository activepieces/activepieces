import { FlowActionType, FlowOperationType, McpToolResult, PopulatedFlow, StepLocationRelativeToParent } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { chatFlowAwareness } from '../../../../src/app/ee/agent/chat-flow-awareness'
import { db } from '../../../helpers/db'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('chat flow awareness', () => {
    it('tells the agent what the user changed in its next tool result', async () => {
        const { ctx, flow, wrap } = await setup()
        await wrap({ toolTitle: 'ap_flow_structure' })({ flowId: flow.id })

        await userEditsStep({ ctx, flowId: flow.id, name: 'step_1', code: 'user version' })
        const next = await wrap({ toolTitle: 'ap_flow_structure' })({ flowId: flow.id })

        expect(textOf(next)).toContain(`The user edited flow ${flow.id}`)
        expect(textOf(next)).toContain('step_1')
        expect(textOf(next)).toContain('"user version"')
    })

    it('refuses a write to a step the user changed since the agent last looked', async () => {
        const { ctx, flow, execute, wrap } = await setup()
        await wrap({ toolTitle: 'ap_flow_structure' })({ flowId: flow.id })

        await userEditsStep({ ctx, flowId: flow.id, name: 'step_1', code: 'user version' })
        execute.mockClear()
        const staleWrite = await wrap({ toolTitle: 'ap_update_step' })({ flowId: flow.id, stepName: 'step_1' })

        expect(staleWrite.isError).toBe(true)
        expect(textOf(staleWrite)).toContain('Not applied')
        expect(execute).not.toHaveBeenCalled()
    })

    it('lets the agent write to a step the user did not change', async () => {
        const { ctx, flow, execute, wrap } = await setup()
        await wrap({ toolTitle: 'ap_flow_structure' })({ flowId: flow.id })

        await userEditsStep({ ctx, flowId: flow.id, name: 'step_1', code: 'user version' })
        execute.mockClear()
        const otherStep = await wrap({ toolTitle: 'ap_update_step' })({ flowId: flow.id, stepName: 'step_2' })

        expect(otherStep.isError).toBeUndefined()
        expect(execute).toHaveBeenCalledTimes(1)
        expect(textOf(otherStep)).toContain('step_1')
    })

    it('does not report the agent its own edits', async () => {
        const { ctx, flow, conversationId } = await setup()
        const read = async (): Promise<McpToolResult> => ({ content: [{ type: 'text', text: 'done' }] })
        const agentWrite = async (): Promise<McpToolResult> => {
            await userEditsStep({ ctx, flowId: flow.id, name: 'step_2', code: 'agent version' })
            return { content: [{ type: 'text', text: 'updated' }] }
        }
        const awareness = chatFlowAwareness(app.log)

        await awareness.wrap({ execute: read, toolTitle: 'ap_flow_structure', conversationId, projectId: ctx.project.id })({ flowId: flow.id })
        await awareness.wrap({ execute: agentWrite, toolTitle: 'ap_update_step', conversationId, projectId: ctx.project.id })({ flowId: flow.id, stepName: 'step_2' })
        const next = await awareness.wrap({ execute: read, toolTitle: 'ap_flow_structure', conversationId, projectId: ctx.project.id })({ flowId: flow.id })

        expect(textOf(next)).toBe('done')
    })

    it('keeps protecting a step the user changed until the agent reads it', async () => {
        const { ctx, flow, execute, wrap } = await setup()
        await wrap({ toolTitle: 'ap_flow_structure' })({ flowId: flow.id })

        await userEditsStep({ ctx, flowId: flow.id, name: 'step_1', code: 'user version' })
        await wrap({ toolTitle: 'ap_update_step' })({ flowId: flow.id, stepName: 'step_2' })
        execute.mockClear()
        const blindWrite = await wrap({ toolTitle: 'ap_update_step' })({ flowId: flow.id, stepName: 'step_1' })
        await wrap({ toolTitle: 'ap_read_step_settings' })({ flowId: flow.id, stepName: 'step_1' })
        const informedWrite = await wrap({ toolTitle: 'ap_update_step' })({ flowId: flow.id, stepName: 'step_1' })

        expect(blindWrite.isError).toBe(true)
        expect(informedWrite.isError).toBeUndefined()
        expect(execute).toHaveBeenCalledTimes(2)
    })

    it('refuses deleting a loop whose inner step the user changed', async () => {
        const { ctx, conversationId, execute } = await setup()
        const flow = await flowWithLoop(ctx)
        const wrap = ({ toolTitle }: { toolTitle: string }): ((args: Record<string, unknown>) => Promise<McpToolResult>) => chatFlowAwareness(app.log).wrap({ execute, toolTitle, conversationId, projectId: ctx.project.id })
        await wrap({ toolTitle: 'ap_flow_structure' })({ flowId: flow.id })

        await userEditsStep({ ctx, flowId: flow.id, name: 'step_2', code: 'user version' })
        execute.mockClear()
        const deleteLoop = await wrap({ toolTitle: 'ap_delete_step' })({ flowId: flow.id, stepName: 'step_1' })

        expect(deleteLoop.isError).toBe(true)
        expect(execute).not.toHaveBeenCalled()
    })

    it('reports an edit the user made while a test run was going', async () => {
        const { ctx, flow, conversationId } = await setup()
        const awareness = chatFlowAwareness(app.log)
        const read = async (): Promise<McpToolResult> => ({ content: [{ type: 'text', text: 'done' }] })
        const testRunWhileUserEdits = async (): Promise<McpToolResult> => {
            await userEditsStep({ ctx, flowId: flow.id, name: 'step_1', code: 'edited during the run' })
            return { content: [{ type: 'text', text: 'run finished' }] }
        }

        await awareness.wrap({ execute: read, toolTitle: 'ap_flow_structure', conversationId, projectId: ctx.project.id })({ flowId: flow.id })
        await awareness.wrap({ execute: testRunWhileUserEdits, toolTitle: 'ap_test_flow', conversationId, projectId: ctx.project.id })({ flowId: flow.id })
        const next = await awareness.wrap({ execute: read, toolTitle: 'ap_list_runs', conversationId, projectId: ctx.project.id })({ flowId: flow.id })

        expect(textOf(next)).toContain('"edited during the run"')
    })
})

async function flowWithLoop(ctx: TestContext): Promise<PopulatedFlow> {
    const created = await ctx.post('/v1/flows', { displayName: 'loop flow', projectId: ctx.project.id }, { query: { projectId: ctx.project.id } })
    const flow: PopulatedFlow = created.json()
    const loop = { type: FlowActionType.LOOP_ON_ITEMS, displayName: 'Loop', name: 'step_1', settings: { items: '{{trigger}}' }, valid: true, skip: false }
    await ctx.post(`/v1/flows/${flow.id}`, { type: FlowOperationType.ADD_ACTION, request: { parentStep: 'trigger', action: loop } })
    const inner = await ctx.post(`/v1/flows/${flow.id}`, { type: FlowOperationType.ADD_ACTION, request: { parentStep: 'step_1', stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP, action: codeStep({ name: 'step_2', code: 'a' }) } })
    expect(inner.statusCode).toBe(StatusCodes.OK)
    return flow
}

async function setup(): Promise<{
    ctx: TestContext
    flow: PopulatedFlow
    conversationId: string
    execute: ReturnType<typeof vi.fn<() => Promise<McpToolResult>>>
    wrap: ({ toolTitle }: { toolTitle: string }) => (args: Record<string, unknown>) => Promise<McpToolResult>
}> {
    const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
    const flow = await flowWithTwoSteps(ctx)
    const created = await ctx.post('/v1/agents/conversations', {})
    expect(created.statusCode).toBe(StatusCodes.CREATED)
    const conversationId: string = created.json().id
    await db.update('agent_conversation', conversationId, { projectId: ctx.project.id })
    const execute = vi.fn(async (): Promise<McpToolResult> => ({ content: [{ type: 'text', text: 'done' }] }))
    const wrap = ({ toolTitle }: { toolTitle: string }): ((args: Record<string, unknown>) => Promise<McpToolResult>) => chatFlowAwareness(app.log).wrap({ execute, toolTitle, conversationId, projectId: ctx.project.id })
    return { ctx, flow, conversationId, execute, wrap }
}

async function flowWithTwoSteps(ctx: TestContext): Promise<PopulatedFlow> {
    const created = await ctx.post('/v1/flows', { displayName: 'aware flow', projectId: ctx.project.id }, { query: { projectId: ctx.project.id } })
    const flow: PopulatedFlow = created.json()
    await ctx.post(`/v1/flows/${flow.id}`, { type: FlowOperationType.ADD_ACTION, request: { parentStep: 'trigger', action: codeStep({ name: 'step_1', code: 'a' }) } })
    await ctx.post(`/v1/flows/${flow.id}`, { type: FlowOperationType.ADD_ACTION, request: { parentStep: 'step_1', action: codeStep({ name: 'step_2', code: 'b' }) } })
    return flow
}

async function userEditsStep({ ctx, flowId, name, code }: { ctx: TestContext, flowId: string, name: string, code: string }): Promise<void> {
    const response = await ctx.post(`/v1/flows/${flowId}`, { type: FlowOperationType.UPDATE_ACTION, request: codeStep({ name, code }) })
    expect(response.statusCode).toBe(StatusCodes.OK)
}

function codeStep({ name, code }: { name: string, code: string }): Record<string, unknown> {
    return {
        type: FlowActionType.CODE,
        displayName: `Code ${name}`,
        name,
        settings: { input: {}, sourceCode: { code, packageJson: '{}' } },
        valid: true,
        skip: false,
    }
}

function textOf(result: McpToolResult): string {
    return result.content.map((part) => part.text).join('\n')
}
