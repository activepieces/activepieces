import { isObject, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { apId, ChatMode, PersistedChatPart, PersistedChatPartType, PersistedToolCallStatus } from '@activepieces/shared'
import { generateObject, LanguageModel } from 'ai'
import { z } from 'zod'
import { JobContext } from '../../../types'
import { ChatTurnToolCall, delayWithJitter } from './run-chat-turn'

const QUICK_REPLIES_TOOL_NAME = 'ap_show_quick_replies'

// Cards that already own the turn's next step — chips would compete with them, so we add none.
const SUGGESTION_CARVE_OUT_TOOLS = new Set([
    'ap_show_showcase',
    'ap_show_questions',
    'ap_show_connection_picker',
    'ap_show_connection_required',
    'ap_show_project_picker',
    'ap_show_mcp_reconnect',
    'ap_show_referral_card',
])

// Flow-construction tools — when the turn already built an automation, offering to automate it is moot.
const AUTOMATION_BUILD_TOOLS = new Set([
    'ap_set_build_plan',
    'ap_build_flow',
    'ap_create_flow',
    'ap_add_step',
])

// Internal/plumbing tools (or their own cards) — irrelevant to the "what did the assistant do" summary.
const SUGGESTION_SUMMARY_HIDDEN_TOOLS = new Set([
    'ap_update_thinking_status',
    'ap_set_phase',
    'ap_load_guide',
    'ap_select_project',
    'ap_deselect_project',
])

// No minItems/maxItems/maxLength: Anthropic's structured-output schema rejects those numeric
// constraints ("For 'array' type, property 'maxItems' is not supported"). Count (1-3) and length
// are enforced in the prompt + trimmed in code below instead.
const QUICK_REPLIES_SCHEMA = z.object({
    replies: z.array(z.string()),
    automationSuggestion: z.object({
        label: z.string(),
        prompt: z.string(),
    }).nullable(),
})

// Guarantees next-step suggestions on every eligible turn: if the model already offered chips inline we
// keep those replies, otherwise we generate them; either way an optional "automate this forever" chip is
// evaluated. On carve-out/ineligible turns it returns uiParts untouched so no chips are shown.
async function appendQuickRepliesPart({ uiParts, toolCalls, userMessage, fastModel, chatMode, dryRun, discoveryOnly, handedOff, abortSignal, log }: {
    uiParts: PersistedChatPart[]
    toolCalls: ChatTurnToolCall[]
    userMessage: string
    fastModel: LanguageModel
    chatMode: string
    dryRun: boolean
    discoveryOnly: boolean
    handedOff: boolean
    abortSignal: AbortSignal
    log: JobContext['log']
}): Promise<PersistedChatPart[]> {
    if (!shouldGenerateSuggestions({ toolCalls, chatMode, dryRun, discoveryOnly, handedOff, aborted: abortSignal.aborted })) {
        return uiParts
    }
    const inlineReplies = extractInlineReplies(uiParts)
    const generated = await generateQuickReplies({
        fastModel,
        turnSummary: summarizeTurnForSuggestions({ uiParts, userMessage }),
        canOfferAutomation: !builtAutomationThisTurn(toolCalls),
        abortSignal,
        log,
    })
    const replies = inlineReplies.length > 0 ? inlineReplies : generated.replies
    if (replies.length === 0 && !generated.automationSuggestion) {
        return uiParts
    }
    const syntheticPart: PersistedChatPart = {
        type: PersistedChatPartType.TOOL_CALL,
        toolCallId: apId(),
        toolName: QUICK_REPLIES_TOOL_NAME,
        input: {
            replies,
            ...spreadIfDefined('automationSuggestion', generated.automationSuggestion),
        },
        output: { displayed: true },
        status: PersistedToolCallStatus.COMPLETED,
    }
    return [...uiParts.filter((part) => !isQuickRepliesPart(part)), syntheticPart]
}

function shouldGenerateSuggestions({ toolCalls, chatMode, dryRun, discoveryOnly, aborted, handedOff }: {
    toolCalls: ChatTurnToolCall[]
    chatMode: string
    dryRun: boolean
    discoveryOnly: boolean
    aborted: boolean
    handedOff?: boolean
}): boolean {
    // A browser hand-off already owns the next step — the user must act in the live browser and use
    // its "continue" button. Generic chat chips here would compete with (and can contradict) that,
    // e.g. offering "I'll submit now" for a step only the human can clear — so add none.
    if (dryRun || discoveryOnly || aborted || handedOff || chatMode === ChatMode.REFERRAL) {
        return false
    }
    return !toolCalls.some((call) => SUGGESTION_CARVE_OUT_TOOLS.has(call.toolName))
}

function builtAutomationThisTurn(toolCalls: ChatTurnToolCall[]): boolean {
    return toolCalls.some((call) => AUTOMATION_BUILD_TOOLS.has(call.toolName))
}

async function generateQuickReplies({ fastModel, turnSummary, canOfferAutomation, abortSignal, log }: {
    fastModel: LanguageModel
    turnSummary: string
    canOfferAutomation: boolean
    abortSignal: AbortSignal
    log: JobContext['log']
}): Promise<{ replies: string[], automationSuggestion?: { label: string, prompt: string } }> {
    const prompt = buildQuickRepliesPrompt({ turnSummary, canOfferAutomation })
    for (let attempt = 0; attempt < 2; attempt++) {
        if (abortSignal.aborted) {
            break
        }
        const { data, error } = await tryCatch(() => generateObject({
            model: fastModel,
            abortSignal,
            schema: QUICK_REPLIES_SCHEMA,
            prompt,
        }))
        if (data) {
            const replies = data.object.replies.map((reply) => reply.trim()).filter((reply) => reply.length > 0).slice(0, 3)
            const automationSuggestion = canOfferAutomation ? (data.object.automationSuggestion ?? undefined) : undefined
            return { replies, ...spreadIfDefined('automationSuggestion', automationSuggestion) }
        }
        log.warn({ error, attempt }, '[chatQuickReplies] Quick-replies generation attempt failed')
        if (attempt === 0) {
            await delayWithJitter(500)
        }
    }
    return { replies: [] }
}

function buildQuickRepliesPrompt({ turnSummary, canOfferAutomation }: { turnSummary: string, canOfferAutomation: boolean }): string {
    const automationInstruction = canOfferAutomation
        ? `Then decide whether the task the user just completed is something REPEATABLE they would want to put on autopilot as an automation — e.g. they generated an asset, compiled or researched data, sent a message, or updated records; work that recurs. If YES, set "automationSuggestion":
- "label": a punchy, upbeat, marketing-style chip about putting this work on autopilot — max ~7 words, no ending period. Use ONLY affirmative, positive phrasing and START WITH A POSITIVE VERB; do NOT begin with a negative word like "Don't", "Never", "No", or "Stop", and avoid the cliché "do it every day". Match this VOICE: "Put this research on autopilot", "Automate this for me from now on", "Turn this into a workflow", "Let AI keep this updated".
- "prompt": the first-person message sent when the user taps it, telling the assistant to set it up to run automatically — e.g. "Set this up to run automatically for me".
If the task is a one-off, purely informational, or there is nothing worth automating, set "automationSuggestion" to null.`
        : 'Set "automationSuggestion" to null.'
    return `You write the follow-up suggestion chips shown under the chat input after the assistant finishes a turn in Activepieces, an AI automation platform.

From the turn below, write 1-3 SHORT next-step suggestions in the USER's first-person voice (what they would tap to say next to the assistant). Each must be at most 80 characters, concrete, and specific to THIS conversation. Never generic filler like "Tell me more" or "What else can you do".

${automationInstruction}

--- TURN ---
${turnSummary}`
}

function summarizeTurnForSuggestions({ uiParts, userMessage }: { uiParts: PersistedChatPart[], userMessage: string }): string {
    const textParts: string[] = []
    const actions: string[] = []
    for (const part of uiParts) {
        if (part.type === PersistedChatPartType.TEXT && part.text) {
            textParts.push(part.text)
        }
        else if (part.type === PersistedChatPartType.TOOL_CALL) {
            if (part.toolName.startsWith('ap_show_') || SUGGESTION_SUMMARY_HIDDEN_TOOLS.has(part.toolName)) {
                continue
            }
            const input = isObject(part.input) ? part.input : {}
            const doneTitle = typeof input['doneTitle'] === 'string' ? input['doneTitle'] : undefined
            actions.push(doneTitle || part.title || part.toolName)
        }
    }
    const assistantText = textParts.join('\n').slice(0, 1200)
    const uniqueActions = [...new Set(actions)].slice(0, 12)
    const actionsBlock = uniqueActions.length > 0 ? uniqueActions.map((action) => `- ${action}`).join('\n') : '(no tools — a direct reply)'
    return `The user's last message:\n${userMessage}\n\nWhat the assistant just did:\n${actionsBlock}\n\nThe assistant's reply to the user:\n${assistantText || '(no visible reply)'}`
}

function isQuickRepliesPart(part: PersistedChatPart): boolean {
    return part.type === PersistedChatPartType.TOOL_CALL && part.toolName === QUICK_REPLIES_TOOL_NAME
}

function extractInlineReplies(uiParts: PersistedChatPart[]): string[] {
    for (let i = uiParts.length - 1; i >= 0; i--) {
        const part = uiParts[i]
        if (part.type === PersistedChatPartType.TOOL_CALL && part.toolName === QUICK_REPLIES_TOOL_NAME) {
            const input = isObject(part.input) ? part.input : {}
            return Array.isArray(input['replies']) ? input['replies'].filter((reply): reply is string => typeof reply === 'string') : []
        }
    }
    return []
}

export const chatQuickReplies = {
    appendQuickRepliesPart,
    shouldGenerateSuggestions,
    builtAutomationThisTurn,
    extractInlineReplies,
    summarizeTurnForSuggestions,
    isQuickRepliesPart,
}
