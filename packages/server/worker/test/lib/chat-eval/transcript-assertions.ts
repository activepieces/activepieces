import { chatToolPhases, PersistedChatPart, PersistedChatPartType } from '@activepieces/shared'
import { ChatEvalAssertion } from './fixture'
import { ChatTurnResult } from '../../../src/lib/execute/jobs/ee/chat/run-chat-turn'

const ASKED_HOW_PATTERNS = [
    /\bhow (do|would|should|will|might) (you|we|i)\b/i,
    /\bwhich (field|column|property|trigger|step|action|piece|connection)\b[^?]*\?/i,
    /\bwhat (field|column|property|trigger|step|action)\b[^?]*\?/i,
]

const DEFAULT_QUESTION_CARD_PATTERN = /question|quick_repl/i

function assistantText(result: ChatTurnResult): string {
    return result.uiParts
        .filter((part): part is Extract<PersistedChatPart, { type: PersistedChatPartType.TEXT }> => part.type === PersistedChatPartType.TEXT)
        .map((part) => part.text)
        .join('\n')
}

function firstOrder(result: ChatTurnResult, toolName: string): number {
    const match = result.toolCalls.find((call) => call.toolName === toolName)
    return match?.order ?? -1
}

function neverAskedHow(result: ChatTurnResult): AssertionOutcome {
    const text = assistantText(result)
    const matched = ASKED_HOW_PATTERNS.find((pattern) => pattern.test(text))
    return matched
        ? { pass: false, reason: `assistant asked a "how/technical" question matching ${matched}` }
        : { pass: true, reason: 'no how/technical clarifying questions found' }
}

function neverCutOff(result: ChatTurnResult): AssertionOutcome {
    const cutOff = result.truncatedAfterRetries || result.finishReason === 'length'
    return cutOff
        ? { pass: false, reason: `response was cut off (truncatedAfterRetries=${result.truncatedAfterRetries}, finishReason=${result.finishReason})` }
        : { pass: true, reason: 'response completed without truncation' }
}

function noBuildToolBeforePhaseSet(result: ChatTurnResult): AssertionOutcome {
    const violation = result.toolCalls.find((call) => chatToolPhases.isBuildOnlyTool(call.toolName) && call.phase !== 'build')
    return violation
        ? { pass: false, reason: `build-only tool "${violation.toolName}" ran while phase was "${violation.phase}"` }
        : { pass: true, reason: 'all build-only tools ran in the build phase' }
}

function calledBefore(result: ChatTurnResult, a: string, b: string): AssertionOutcome {
    const orderA = firstOrder(result, a)
    const orderB = firstOrder(result, b)
    if (orderA === -1) {
        return { pass: false, reason: `"${a}" was never called` }
    }
    if (orderB === -1) {
        return { pass: false, reason: `"${b}" was never called` }
    }
    if (orderA < orderB) {
        return { pass: true, reason: `"${a}" was called before "${b}"` }
    }
    return { pass: false, reason: `"${a}" (order ${orderA}) was not called before "${b}" (order ${orderB})` }
}

function reachedToolWithin(result: ChatTurnResult, toolName: string, n: number): AssertionOutcome {
    const order = firstOrder(result, toolName)
    if (order === -1) {
        return { pass: false, reason: `"${toolName}" was never called` }
    }
    return order <= n
        ? { pass: true, reason: `"${toolName}" reached at order ${order} (<= ${n})` }
        : { pass: false, reason: `"${toolName}" first reached at order ${order} (> ${n})` }
}

function maxQuestionCards(result: ChatTurnResult, n: number, toolNames?: string[]): AssertionOutcome {
    const count = result.toolCalls.filter((call) =>
        toolNames ? toolNames.includes(call.toolName) : DEFAULT_QUESTION_CARD_PATTERN.test(call.toolName),
    ).length
    return count <= n
        ? { pass: true, reason: `${count} question card(s) shown (<= ${n})` }
        : { pass: false, reason: `${count} question card(s) shown (> ${n})` }
}

function runAssertion(result: ChatTurnResult, assertion: ChatEvalAssertion): AssertionResult {
    switch (assertion.type) {
        case 'neverAskedHow':
            return { type: assertion.type, ...neverAskedHow(result) }
        case 'neverCutOff':
            return { type: assertion.type, ...neverCutOff(result) }
        case 'noBuildToolBeforePhaseSet':
            return { type: assertion.type, ...noBuildToolBeforePhaseSet(result) }
        case 'calledBefore':
            return { type: assertion.type, ...calledBefore(result, assertion.a, assertion.b) }
        case 'reachedToolWithin':
            return { type: assertion.type, ...reachedToolWithin(result, assertion.toolName, assertion.n) }
        case 'maxQuestionCards':
            return { type: assertion.type, ...maxQuestionCards(result, assertion.n, assertion.toolNames) }
    }
}

export const transcriptAssertions = {
    neverAskedHow,
    neverCutOff,
    noBuildToolBeforePhaseSet,
    calledBefore,
    reachedToolWithin,
    maxQuestionCards,
    runAssertion,
}

export type AssertionOutcome = {
    pass: boolean
    reason: string
}

export type AssertionResult = AssertionOutcome & {
    type: ChatEvalAssertion['type']
}
