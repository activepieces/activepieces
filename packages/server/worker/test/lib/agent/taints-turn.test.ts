import { agentToolPhases } from '@activepieces/shared'
import { agentWorkerTools } from '../../../src/lib/execute/jobs/ee/agent/agent-worker-tools'
import { describe, expect, it } from 'vitest'

const { taintsTurn } = agentToolPhases

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
    const wrapOne = ({ name }: { name: string }) => {
        const taintState = { tainted: false }
        const taintedWhenToolRan: boolean[] = []
        const wrapped = agentWorkerTools.wrapToolsWithTaint({
            tools: {
                [name]: {
                    execute: async () => {
                        taintedWhenToolRan.push(taintState.tainted)
                        return 'ok'
                    },
                },
            } as never,
            taintState,
        })
        return { taintState, wrapped, taintedWhenToolRan }
    }

    it('taints before the tool runs, not after, so a same-batch agent edit cannot slip through', async () => {
        const { taintState, wrapped, taintedWhenToolRan } = wrapOne({ name: 'ap_explore_data' })

        await wrapped['ap_explore_data'].execute?.({}, {} as never)

        expect(taintedWhenToolRan).toEqual([true])
        expect(taintState.tainted).toBe(true)
    })

    it('leaves the turn clean for a catalog tool, so the agent can still be built', async () => {
        const { taintState, wrapped } = wrapOne({ name: 'ap_research_pieces' })

        await wrapped['ap_research_pieces'].execute?.({}, {} as never)

        expect(taintState.tainted).toBe(false)
    })

    it('still returns what the wrapped tool returned', async () => {
        const { wrapped } = wrapOne({ name: 'ap_research_pieces' })

        expect(await wrapped['ap_research_pieces'].execute?.({}, {} as never)).toBe('ok')
    })
})
