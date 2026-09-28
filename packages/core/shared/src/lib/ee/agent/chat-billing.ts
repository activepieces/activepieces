import { AIProviderName, isObject } from '@activepieces/core-utils'

function isFlatBilledToolCall({ toolName, output }: ChatToolCall): boolean {
    const billable = toolName.startsWith('mcp__') || FLAT_BILLED_TOOL_NAMES.has(toolName)
    const paidAtCost = TOOLS_THAT_BILL_AT_COST.has(toolName) && isObject(output) && output['billedAtCost'] === true
    return billable && !paidAtCost
}

function creditsForTurn({ provider, toolCalls }: { provider: string, toolCalls: ChatToolCall[] }): TurnCredits {
    const messageCredits = provider === AIProviderName.ACTIVEPIECES ? 0 : CHAT_CREDITS_PER_OWN_KEY_TURN
    const billedToolCalls = toolCalls.filter(isFlatBilledToolCall).length
    return { messageCredits, billedToolCalls, total: messageCredits + billedToolCalls * CHAT_CREDITS_PER_TOOL_CALL }
}

const FLAT_BILLED_TOOL_NAMES = new Set<string>([
    'ap_web_search',
    'ap_scrape_url',
    'ap_generate_image',
    'ap_execute_action',
    'ap_explore_data',
    'ap_run_code',
])

const TOOLS_THAT_BILL_AT_COST = new Set<string>(['ap_web_search', 'ap_generate_image'])

const CHAT_CREDITS_PER_OWN_KEY_TURN = 1

export const CHAT_CREDITS_PER_TOOL_CALL = 1

export const chatBilling = {
    isFlatBilledToolCall,
    creditsForTurn,
}

export type ChatToolCall = {
    toolName: string
    output: unknown
}

export type TurnCredits = {
    messageCredits: number
    billedToolCalls: number
    total: number
}
