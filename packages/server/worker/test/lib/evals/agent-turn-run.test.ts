import { AIProviderName } from '@activepieces/core-utils'
import { PersistedAgentPartType, PersistedToolCallStatus } from '@activepieces/shared'
import { jsonSchema, tool } from 'ai'
import { describe, expect, it, vi } from 'vitest'
import { AgentTurnResult, runAgentTurn } from '../../../src/lib/execute/jobs/ee/agent/run-agent-turn'
import { evalAgentTurn, TurnToolCall } from './agent-turn'
import { EvalCase } from './eval-case'

vi.mock('../../../src/lib/execute/jobs/ee/agent/run-agent-turn', () => ({ runAgentTurn: vi.fn() }))

describe('evalAgentTurn.changedFlowIds', () => {
    it('validates the copy a duplicate made, not the untouched original', () => {
        const duplicate = call({ toolName: 'ap_duplicate_flow', input: { flowId: 'orig' }, output: { content: [{ type: 'text', text: '✅ Flow duplicated successfully.\n  Original: "Leads" (id: orig)\n  Copy: "Copy of Leads" (id: copy1)' }] } })

        expect(evalAgentTurn.changedFlowIds([duplicate])).toEqual(['copy1'])
        expect(evalAgentTurn.changedFlowIds([duplicate, call({ toolName: 'ap_update_step', input: { flowId: 'orig' } })])).toEqual(['copy1', 'orig'])
    })

    it('reads the id at the end of the copy line when the flow name itself contains "(id: …)"', () => {
        const text = '✅ Flow duplicated successfully.\n  Original: "Sync" (id: fake1)" (id: orig)\n  Copy: "Sync" (id: fake2)" (id: copy3)\n\nNote: Connections are not copied.'

        expect(evalAgentTurn.changedFlowIds([call({ toolName: 'ap_duplicate_flow', input: { flowId: 'orig' }, output: { content: [{ type: 'text', text }] } })])).toEqual(['copy3'])
    })

    it('reads the copy id from structured content when the tool gives one', () => {
        expect(evalAgentTurn.changedFlowIds([call({ toolName: 'ap_duplicate_flow', input: { flowId: 'orig' }, output: { structuredContent: { flowId: 'copy2' } } })])).toEqual(['copy2'])
    })
})

describe('evalAgentTurn.changedFlowIds only trusts flows the turn proved exist', () => {
    it('ignores flow ids passed to tools that are not flow edits, like a build plan placeholder', () => {
        expect(evalAgentTurn.changedFlowIds([call({ toolName: 'ap_set_build_plan', input: { phase: 'building', flowId: 'placeholder' }, output: { ok: true } })])).toEqual([])
    })

    it('ignores edits that errored or failed', () => {
        const calls = [
            call({ toolName: 'ap_update_step', input: { flowId: 'gone' }, output: { content: [{ type: 'text', text: '❌ Flow not found.' }] } }),
            call({ toolName: 'ap_add_step', input: { flowId: 'bad' }, output: { success: false } }),
            { ...call({ toolName: 'ap_update_trigger', input: { flowId: 'rejected' } }), errored: true },
        ]

        expect(evalAgentTurn.changedFlowIds(calls)).toEqual([])
    })

    it('keeps a built flow the tool reports with problems, since its id proves it exists', () => {
        const built = call({ toolName: 'ap_build_flow', input: { flowName: 'F' }, output: { content: [{ type: 'text', text: '❌ Flow "F" created (id: f1), but some settings were dropped' }], structuredContent: { flowId: 'f1' } } })

        expect(evalAgentTurn.changedFlowIds([built, call({ toolName: 'ap_update_step', input: { flowId: 'f1' } })])).toEqual(['f1'])
    })
})

describe('evalAgentTurn.run', () => {
    it('stops the turn clock before reading the flows after the turn', async () => {
        vi.mocked(runAgentTurn).mockResolvedValue(turnResult())
        const flowStructure = vi.fn(async () => {
            await new Promise((resolve) => setTimeout(resolve, EVIDENCE_READ_MS))
            return { content: [{ type: 'text', text: 'trigger → step_1' }] }
        })
        const mcp = {
            toolSet: { ap_flow_structure: tool({ inputSchema: jsonSchema<Record<string, unknown>>({ type: 'object' }), execute: flowStructure }) },
            close: async () => {},
            projectId: 'proj-ws',
            projectName: 'eval-ws',
            conversationId: 'evalconv',
        }

        const outcome = await evalAgentTurn.run({ evalCase: liveCase(), recordedToolCalls: [], mcp, modelId: 'test/model', auth: { apiKey: 'k' }, mode: 'live' })

        expect(flowStructure).toHaveBeenCalledOnce()
        expect(outcome.transcript).toContain('FLOW flow-1:\ntrigger → step_1')
        expect(outcome.elapsedMs).toBeLessThan(EVIDENCE_READ_MS)
        expect(outcome.metrics.totalMs).toBeLessThan(EVIDENCE_READ_MS)
    })
})

function call({ toolName, input, output = { success: true } }: { toolName: string, input: unknown, output?: unknown }): TurnToolCall {
    return { toolName, input, output, errorText: undefined, errored: false }
}

function turnResult(): AgentTurnResult {
    return {
        accumulatedResponseMessages: [],
        uiParts: [
            { type: PersistedAgentPartType.TOOL_CALL, toolCallId: 't1', toolName: 'ap_update_step', input: { flowId: 'flow-1' }, output: { success: true }, status: PersistedToolCallStatus.COMPLETED },
            { type: PersistedAgentPartType.TEXT, text: 'Done.' },
        ],
        usage: undefined,
        finishReason: 'stop',
        truncatedAfterRetries: false,
        budgetExceeded: false,
        creditsExhausted: false,
        streamError: null,
        continuations: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        toolCalls: [],
        answeredBy: { model: 'test/model', provider: AIProviderName.OPENROUTER, modelId: 'test/model', thinkingBudget: 0 },
        allModelsFailed: false,
    }
}

function liveCase(): EvalCase {
    return {
        id: 'c1', versionId: 'v1', caseNumber: 1, title: 't', problemType: 'core', checks: ['c'], cutBeforeStep: undefined, targetTool: undefined, preloadedSkills: [], userMessage: 'fix my flow', messages: [{ role: 'user', content: 'fix my flow' }], steps: [], recordedToolCalls: [],
        live: { tier: null, seed: { flows: [], tables: [] }, answers: { questions: null, connections: {} }, codeChecks: {}, faults: [], timeoutMs: 60_000 },
    }
}

const EVIDENCE_READ_MS = 300
