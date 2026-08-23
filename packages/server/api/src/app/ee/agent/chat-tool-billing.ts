import { PersistedAgentMessage, PersistedAgentPartType, PersistedAgentRole, PersistedToolCallStatus } from '@activepieces/shared'

const BILLABLE_EXTERNAL_TOOL_NAMES = new Set<string>([
    'ap_web_search',
    'ap_scrape_url',
    'ap_generate_image',
    'ap_execute_action',
    'ap_explore_data',
    'ap_run_code',
])

function isBillableChatToolCall(toolName: string): boolean {
    return toolName.startsWith('mcp__') || BILLABLE_EXTERNAL_TOOL_NAMES.has(toolName)
}

function countBillableToolCallsInLatestTurn({ messages }: { messages: PersistedAgentMessage[] }): number {
    const lastUserIndex = messages.map((message) => message.role).lastIndexOf(PersistedAgentRole.USER)
    const turn = lastUserIndex === -1 ? messages : messages.slice(lastUserIndex + 1)
    return turn.reduce((sum, message) => sum + message.parts.filter((part) =>
        part.type === PersistedAgentPartType.TOOL_CALL
        && part.status === PersistedToolCallStatus.COMPLETED
        && isBillableChatToolCall(part.toolName),
    ).length, 0)
}

export const chatToolBilling = {
    isBillableChatToolCall,
    countBillableToolCallsInLatestTurn,
}
