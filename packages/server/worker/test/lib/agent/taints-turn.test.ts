import { agentToolPhases } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'

const { taintsTurn } = agentToolPhases

describe('taintsTurn', () => {
    it.each([
        'ap_research_pieces',
        'ap_search_actions',
        'ap_search_triggers',
        'ap_list_connections',
        'ap_list_ai_models',
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
