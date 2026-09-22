import { agentToolPhases } from '@activepieces/shared'
import { tool, ToolExecutionOptions } from 'ai'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { agentWorkerTools } from '../../../src/lib/execute/jobs/ee/agent/agent-worker-tools'

const { taintsTurn } = agentToolPhases
const options: ToolExecutionOptions<undefined> = { toolCallId: 'call-1', messages: [] }

describe('taintsTurn', () => {
    it.each([
        'ap_research_pieces',
        'ap_search_actions',
        'ap_search_triggers',
        'ap_list_connections',
    ])('lets %s run without closing the turn to agent edits, because it only reads the catalog', (toolName) => {
        expect(taintsTurn(toolName)).toBe(false)
    })

    it.each([
        'ap_execute_action',
        'ap_explore_data',
        'ap_get_run',
        'ap_find_records',
        'ap_read_step_settings',
        'ap_get_piece_props',
        'ap_resolve_property_options',
        'ap_resolve_property_chain',
        'ap_list_ai_models',
    ])('keeps %s tainting, since its result can carry third-party content', (toolName) => {
        expect(taintsTurn(toolName)).toBe(true)
    })

    it('taints an unknown tool, so a new one is never silently exempt', () => {
        expect(taintsTurn('ap_some_tool_added_next_quarter')).toBe(true)
    })

    it('taints a connector tool whose name is generated per connection', () => {
        expect(taintsTurn('gmail_a1b2c3_mcp')).toBe(true)
    })
})

describe('wrapToolsWithTaint', () => {
    const runWrapped = async (name: string) => {
        const taintState = { tainted: false }
        let taintedDuringRun = false
        const wrapped = agentWorkerTools.wrapToolsWithTaint({
            tools: {
                [name]: tool({
                    inputSchema: z.object({}),
                    execute: async () => {
                        taintedDuringRun = taintState.tainted
                        return 'ran'
                    },
                }),
            },
            taintState,
        })
        const result = await wrapped[name].execute?.({}, options)
        return { taintedDuringRun, tainted: taintState.tainted, result }
    }

    it('taints before the tool body runs, so a same-batch agent edit cannot slip through', async () => {
        expect(await runWrapped('ap_explore_data')).toEqual({ taintedDuringRun: true, tainted: true, result: 'ran' })
    })

    it('leaves the turn clean for a catalog tool, so the agent can still be built', async () => {
        expect(await runWrapped('ap_research_pieces')).toEqual({ taintedDuringRun: false, tainted: false, result: 'ran' })
    })
})
