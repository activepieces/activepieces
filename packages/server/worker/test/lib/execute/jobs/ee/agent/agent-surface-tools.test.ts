import { describe, expect, it, vi } from 'vitest'
import { AgentEventEmitter, agentWorkerTools } from '../../../../../../src/lib/execute/jobs/ee/agent/agent-worker-tools'

const silentEmitter: AgentEventEmitter = {
    emitToolProgress: vi.fn(),
    emitActionPreview: vi.fn(),
    emitActionReceipt: vi.fn(),
    emitImageGenerated: vi.fn(),
    emitFileProduced: vi.fn(),
    emitBuildPlan: vi.fn(),
}

const AGENT_TOOL_NAMES = ['ap_list_agents', 'ap_create_agent', 'ap_update_agent']

function offeredToolNames({ agentsAvailable }: { agentsAvailable: boolean }): string[] {
    return Object.keys(agentWorkerTools.createCrossProjectTools({
        executeTool: async () => ({}),
        eventEmitter: silentEmitter,
        waitForApproval: async () => ({ outcome: 'approved' as const }),
        guides: {},
        taintState: { tainted: false },
        agentsAvailable,
    }))
}

describe('the agent tools chat is offered', () => {
    it('are absent when this instance has no agents surface, so the model cannot call one and fail', () => {
        const names = offeredToolNames({ agentsAvailable: false })

        for (const toolName of AGENT_TOOL_NAMES) {
            expect(names, toolName).not.toContain(toolName)
        }
    })

    it('are there when it does', () => {
        const names = offeredToolNames({ agentsAvailable: true })

        for (const toolName of AGENT_TOOL_NAMES) {
            expect(names, toolName).toContain(toolName)
        }
    })

    it('leaves the rest of the local tools alone either way', () => {
        const withAgents = offeredToolNames({ agentsAvailable: true })
        const withoutAgents = offeredToolNames({ agentsAvailable: false })

        expect(withoutAgents).toContain('ap_remember')
        expect(withAgents.filter((name) => !AGENT_TOOL_NAMES.includes(name))).toEqual(withoutAgents)
    })
})
