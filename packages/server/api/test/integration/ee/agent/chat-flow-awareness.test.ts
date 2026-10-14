import { FlowActionType, FlowOperationType, McpToolResult, PopulatedFlow } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { chatFlowAwareness } from '../../../../src/app/ee/agent/chat-flow-awareness'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

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

function textOf(result: McpToolResult): string {
    return result.content.map((part) => part.text).join('\n')
}

describe('chat flow awareness', () => {
    it('ties a conversation to a flow and lists it by flow', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        const flow = await flowWithTwoSteps(ctx)

        const created = await ctx.post('/v1/agents/conversations', { flowId: flow.id })
        expect(created.statusCode).toBe(StatusCodes.CREATED)
        expect(created.json().flowId).toBe(flow.id)
        expect(created.json().projectId).toBe(ctx.project.id)

        const listed = await ctx.get('/v1/agents/conversations', { query: { flowId: flow.id } })
        expect(listed.json().data.map((conversation: { id: string }) => conversation.id)).toEqual([created.json().id])
    })

    it('refuses a flowId from a project the user cannot see', async () => {
        const owner = await createTestContext(app, { plan: { chatEnabled: true } })
        const stranger = await createTestContext(app, { plan: { chatEnabled: true } })
        const flow = await flowWithTwoSteps(owner)

        const response = await stranger.post('/v1/agents/conversations', { flowId: flow.id })
        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
    })

    it('tells the agent about user edits and refuses to overwrite an edited step', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        const flow = await flowWithTwoSteps(ctx)
        const conversationId = (await ctx.post('/v1/agents/conversations', { flowId: flow.id })).json().id
        const execute = vi.fn(async (): Promise<McpToolResult> => ({ content: [{ type: 'text', text: 'done' }] }))
        const wrap = (toolTitle: string) => chatFlowAwareness(app.log).wrap({ execute, toolTitle, conversationId, projectId: ctx.project.id })

        const firstLook = await wrap('ap_flow_structure')({ flowId: flow.id })
        expect(textOf(firstLook)).toBe('done')

        await userEditsStep({ ctx, flowId: flow.id, name: 'step_1', code: 'user version' })

        execute.mockClear()
        const staleWrite = await wrap('ap_update_step')({ flowId: flow.id, stepName: 'step_1' })
        expect(staleWrite.isError).toBe(true)
        expect(textOf(staleWrite)).toContain('step_1')
        expect(execute).not.toHaveBeenCalled()

        const otherStep = await wrap('ap_update_step')({ flowId: flow.id, stepName: 'step_2' })
        expect(execute).toHaveBeenCalledTimes(1)
        expect(textOf(otherStep)).toContain('The user edited flow')
        expect(textOf(otherStep)).toContain('step_1')

        const afterSeen = await wrap('ap_flow_structure')({ flowId: flow.id })
        expect(textOf(afterSeen)).toBe('done')
    })

    it('does not report the agent its own edits', async () => {
        const ctx = await createTestContext(app, { plan: { chatEnabled: true } })
        const flow = await flowWithTwoSteps(ctx)
        const conversationId = (await ctx.post('/v1/agents/conversations', { flowId: flow.id })).json().id
        const agentWrite = async (): Promise<McpToolResult> => {
            await userEditsStep({ ctx, flowId: flow.id, name: 'step_2', code: 'agent version' })
            return { content: [{ type: 'text', text: 'updated' }] }
        }
        const read = async (): Promise<McpToolResult> => ({ content: [{ type: 'text', text: 'done' }] })

        await chatFlowAwareness(app.log).wrap({ execute: read, toolTitle: 'ap_flow_structure', conversationId, projectId: ctx.project.id })({ flowId: flow.id })
        await chatFlowAwareness(app.log).wrap({ execute: agentWrite, toolTitle: 'ap_update_step', conversationId, projectId: ctx.project.id })({ flowId: flow.id, stepName: 'step_2' })
        const next = await chatFlowAwareness(app.log).wrap({ execute: read, toolTitle: 'ap_flow_structure', conversationId, projectId: ctx.project.id })({ flowId: flow.id })

        expect(textOf(next)).toBe('done')
    })
})
