import { AgentToolType } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockListFlows } = vi.hoisted(() => ({
    mockListFlows: vi.fn(),
}))

vi.mock('../../../../src/app/flows/flow/flow.service', () => ({
    flowService: () => ({ list: mockListFlows }),
}))

const { agentHelpers } = await import('../../../../src/app/ee/agent/agent-helpers')

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as never

describe('agentHelpers.resolveFlowTools', () => {
    beforeEach(() => {
        mockListFlows.mockClear()
    })

    it('returns empty array when no flow tool requests are present', async () => {
        const result = await agentHelpers.resolveFlowTools({
            projectId: 'proj-1',
            flowToolRequests: [],
            log,
        })
        expect(result).toEqual([])
        expect(mockListFlows).not.toHaveBeenCalled()
    })

    it('resolves flow tools with schema and descriptions from runnable flows', async () => {
        mockListFlows.mockImplementation(({ versionState }) => {
            if (versionState === 'LOCKED') {
                return Promise.resolve({
                    data: [
                        {
                            id: 'flow-1',
                            externalId: 'ext-flow-1',
                            version: {
                                id: 'ver-1',
                                displayName: 'Send Customer Alert',
                                trigger: {
                                    type: 'PIECE_TRIGGER',
                                    settings: {
                                        pieceName: '@activepieces/piece-mcp',
                                        triggerName: 'mcp_trigger',
                                        input: {
                                            toolDescription: 'Sends an alert to customer',
                                            mcpInputs: {
                                                customerId: { type: 'SHORT_TEXT', required: true, description: 'Customer ID' },
                                            },
                                            returnsResponse: true,
                                        },
                                    },
                                },
                            },
                        },
                    ],
                })
            }
            return Promise.resolve({ data: [] })
        })

        const result = await agentHelpers.resolveFlowTools({
            projectId: 'proj-1',
            flowToolRequests: [
                {
                    type: AgentToolType.FLOW,
                    toolName: 'send_alert',
                    externalFlowId: 'ext-flow-1',
                },
            ],
            log,
        })

        expect(result).toHaveLength(1)
        expect(result[0]).toMatchObject({
            toolName: 'send_alert',
            flowId: 'flow-1',
            flowVersionId: 'ver-1',
            description: 'Sends an alert to customer',
            returnsResponse: true,
        })
        expect(result[0].inputSchema).toBeDefined()
    })

    it('throws validation error when requested flow is not found in the project', async () => {
        mockListFlows.mockResolvedValue({ data: [] })

        await expect(agentHelpers.resolveFlowTools({
            projectId: 'proj-1',
            flowToolRequests: [
                {
                    type: AgentToolType.FLOW,
                    toolName: 'missing_tool',
                    externalFlowId: 'ext-missing',
                },
            ],
            log,
        })).rejects.toThrowError(/missing_tool/)
    })
})
