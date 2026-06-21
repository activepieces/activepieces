import { AgentFlowTool, AgentToolType, ExecutionToolStatus, McpPropertyType, WorkerToApiContract } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildFlowTools } from '../../src/lib/ai/agent/tools/flow-tools'

const flowTool: AgentFlowTool = {
    type: AgentToolType.FLOW,
    toolName: 'send_email_flow',
    externalFlowId: 'ext-flow-1',
}

function mcpTriggerSettings(returnsResponse: boolean) {
    return {
        pieceName: '@activepieces/piece-webhook',
        triggerName: 'catch_request',
        input: {
            toolName: 'send_email_flow',
            toolDescription: 'Sends an email',
            inputSchema: [{ name: 'to', type: McpPropertyType.TEXT, description: 'recipient', required: true }],
            returnsResponse,
        },
    }
}

function populatedFlow(returnsResponse: boolean) {
    return { id: 'flow-1', externalId: 'ext-flow-1', version: { trigger: { settings: mcpTriggerSettings(returnsResponse) } } }
}

function makeApiClient(overrides: Partial<WorkerToApiContract> = {}, returnsResponse = false): WorkerToApiContract {
    return {
        listPopulatedFlows: vi.fn().mockResolvedValue({ data: [populatedFlow(returnsResponse)], next: null, previous: null }),
        invokeFlowTool: vi.fn().mockResolvedValue({ status: 200, body: { ok: true } }),
        ...overrides,
    } as unknown as WorkerToApiContract
}

const makeLogger = () => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn() } as unknown as Parameters<typeof buildFlowTools>[0]['log'])

describe('buildFlowTools', () => {
    beforeEach(() => vi.clearAllMocks())

    it('builds a tool per MCP-trigger flow and looks flows up by external id', async () => {
        const apiClient = makeApiClient()
        const { tools, toolKeyToAgentTool } = await buildFlowTools({ flowTools: [flowTool], apiClient, engineToken: 'engine-token', log: makeLogger() })

        expect(apiClient.listPopulatedFlows).toHaveBeenCalledWith({ engineToken: 'engine-token', externalIds: ['ext-flow-1'] })
        const toolName = Object.keys(tools)[0]
        expect(toolName).toBeDefined()
        expect(toolKeyToAgentTool[toolName]).toEqual(flowTool)
    })

    it('invokes the flow webhook synchronously when the trigger returns a response', async () => {
        const apiClient = makeApiClient({}, true)
        const { tools } = await buildFlowTools({ flowTools: [flowTool], apiClient, engineToken: 'engine-token', log: makeLogger() })
        const toolName = Object.keys(tools)[0]

        const output = await tools[toolName].execute!({ to: 'a@b.com' }, { toolCallId: 't1', messages: [] })

        expect(apiClient.invokeFlowTool).toHaveBeenCalledWith({ engineToken: 'engine-token', flowId: 'flow-1', async: false, inputs: { to: 'a@b.com' } })
        expect(output).toMatchObject({ status: ExecutionToolStatus.SUCCESS, output: { ok: true } })
    })

    it('invokes asynchronously when the trigger does not return a response', async () => {
        const apiClient = makeApiClient({}, false)
        const { tools } = await buildFlowTools({ flowTools: [flowTool], apiClient, engineToken: 'engine-token', log: makeLogger() })
        const toolName = Object.keys(tools)[0]

        await tools[toolName].execute!({ to: 'a@b.com' }, { toolCallId: 't1', messages: [] })

        expect(apiClient.invokeFlowTool).toHaveBeenCalledWith(expect.objectContaining({ async: true }))
    })

    it('maps a non-2xx webhook response to FAILED', async () => {
        const apiClient = makeApiClient({ invokeFlowTool: vi.fn().mockResolvedValue({ status: 500, body: 'boom' }) }, true)
        const { tools } = await buildFlowTools({ flowTools: [flowTool], apiClient, engineToken: 'engine-token', log: makeLogger() })
        const toolName = Object.keys(tools)[0]

        const output = await tools[toolName].execute!({ to: 'a@b.com' }, { toolCallId: 't1', messages: [] })

        expect(output).toMatchObject({ status: ExecutionToolStatus.FAILED })
    })

    it('skips flows whose trigger is not an MCP tool trigger', async () => {
        const apiClient = makeApiClient({
            listPopulatedFlows: vi.fn().mockResolvedValue({ data: [{ id: 'flow-1', externalId: 'ext-flow-1', version: { trigger: { settings: { pieceName: 'x' } } } }], next: null, previous: null }),
        })
        const { tools } = await buildFlowTools({ flowTools: [flowTool], apiClient, engineToken: 'engine-token', log: makeLogger() })

        expect(Object.keys(tools)).toHaveLength(0)
        expect(apiClient.invokeFlowTool).not.toHaveBeenCalled()
    })

    it('skips flow tools whose external id is not returned', async () => {
        const apiClient = makeApiClient({ listPopulatedFlows: vi.fn().mockResolvedValue({ data: [], next: null, previous: null }) })
        const { tools } = await buildFlowTools({ flowTools: [flowTool], apiClient, engineToken: 'engine-token', log: makeLogger() })

        expect(Object.keys(tools)).toHaveLength(0)
    })
})
