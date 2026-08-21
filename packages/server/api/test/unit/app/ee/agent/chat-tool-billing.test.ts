import { PersistedAgentMessage, PersistedAgentPart, PersistedAgentPartType, PersistedAgentRole, PersistedToolCallStatus } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { chatToolBilling } from '../../../../../src/app/ee/agent/chat-tool-billing'
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

function toolCallPart({ toolName, status }: { toolName: string, status: PersistedToolCallStatus }): PersistedAgentPart {
    return {
        type: PersistedAgentPartType.TOOL_CALL,
        toolCallId: `${toolName}-${status}`,
        toolName,
        input: {},
        status,
    }
}

function assistant(parts: PersistedAgentPart[]): PersistedAgentMessage {
    return { role: PersistedAgentRole.ASSISTANT, parts }
}

function user(text: string): PersistedAgentMessage {
    return { role: PersistedAgentRole.USER, parts: [{ type: PersistedAgentPartType.TEXT, text }] }
}

describe('chatToolBilling.countBillableToolCallsInLatestTurn', () => {
    it('does not bill a tool call that never returned a result', () => {
        const messages = [
            user('do it'),
            assistant([
                toolCallPart({ toolName: 'ap_web_search', status: PersistedToolCallStatus.COMPLETED }),
                toolCallPart({ toolName: 'ap_scrape_url', status: PersistedToolCallStatus.ERROR }),
            ]),
        ]
        expect(chatToolBilling.countBillableToolCallsInLatestTurn({ messages })).toBe(1)
    })

    it('bills nothing when every billable call errored', () => {
        const messages = [
            user('do it'),
            assistant([
                toolCallPart({ toolName: 'mcp__attio__list_records', status: PersistedToolCallStatus.ERROR }),
                toolCallPart({ toolName: 'ap_execute_action', status: PersistedToolCallStatus.ERROR }),
            ]),
        ]
        expect(chatToolBilling.countBillableToolCallsInLatestTurn({ messages })).toBe(0)
    })

    it('counts only the latest turn', () => {
        const messages = [
            user('first'),
            assistant([toolCallPart({ toolName: 'ap_web_search', status: PersistedToolCallStatus.COMPLETED })]),
            user('second'),
            assistant([toolCallPart({ toolName: 'ap_run_code', status: PersistedToolCallStatus.COMPLETED })]),
        ]
        expect(chatToolBilling.countBillableToolCallsInLatestTurn({ messages })).toBe(1)
    })

    it('ignores non-billable tools regardless of status', () => {
        const messages = [
            user('do it'),
            assistant([
                toolCallPart({ toolName: 'ap_update_flow', status: PersistedToolCallStatus.COMPLETED }),
                toolCallPart({ toolName: 'ap_update_flow', status: PersistedToolCallStatus.ERROR }),
            ]),
        ]
        expect(chatToolBilling.countBillableToolCallsInLatestTurn({ messages })).toBe(0)
    })
})
