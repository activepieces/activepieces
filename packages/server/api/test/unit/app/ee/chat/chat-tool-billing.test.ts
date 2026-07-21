import { describe, expect, it } from 'vitest'
import { chatToolBilling } from '../../../../../src/app/ee/chat/chat-tool-billing'
import { ALL_CONTROLLABLE_TOOL_NAMES, LOCKED_TOOL_NAMES, PLATFORM_LEVEL_TOOL_NAMES } from '../../../../../src/app/mcp/tools'

const AP_NATIVE_TOOL_NAMES = [
    ...LOCKED_TOOL_NAMES,
    ...PLATFORM_LEVEL_TOOL_NAMES,
    ...ALL_CONTROLLABLE_TOOL_NAMES,
]

describe('chatToolBilling.isBillableChatToolCall', () => {
    it('never bills an AP-native MCP tool (they are free or already billed via the run)', () => {
        const billable = AP_NATIVE_TOOL_NAMES.filter((name) => chatToolBilling.isBillableChatToolCall(name))
        expect(billable, `These AP-native tools must not be billed: ${billable.join(', ')}`).toEqual([])
    })

    it('bills piece integration calls (mcp__<connectorUuid>__action)', () => {
        expect(chatToolBilling.isBillableChatToolCall('mcp__attio__list_records')).toBe(true)
    })

    it('bills the paid external tools', () => {
        expect(chatToolBilling.isBillableChatToolCall('ap_web_search')).toBe(true)
        expect(chatToolBilling.isBillableChatToolCall('ap_scrape_url')).toBe(true)
        expect(chatToolBilling.isBillableChatToolCall('ap_generate_image')).toBe(true)
    })

    it('bills chat-initiated ad-hoc executions (not separately metered)', () => {
        expect(chatToolBilling.isBillableChatToolCall('ap_execute_action')).toBe(true)
        expect(chatToolBilling.isBillableChatToolCall('ap_explore_data')).toBe(true)
        expect(chatToolBilling.isBillableChatToolCall('ap_run_code')).toBe(true)
    })

    it('does not bill an unknown tool (fail-safe default)', () => {
        expect(chatToolBilling.isBillableChatToolCall('ap_some_tool_added_later')).toBe(false)
    })
})
