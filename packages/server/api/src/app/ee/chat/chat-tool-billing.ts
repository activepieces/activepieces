

const BILLABLE_EXTERNAL_TOOL_NAMES = new Set<string>([
    'ap_web_search',
    'ap_scrape_url',
    'ap_generate_image',
    'ap_execute_action',
])

function isBillableChatToolCall(toolName: string): boolean {
    return toolName.startsWith('mcp__') || BILLABLE_EXTERNAL_TOOL_NAMES.has(toolName)
}

export const chatToolBilling = {
    isBillableChatToolCall,
}
