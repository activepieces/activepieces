import { agentToolPhases, PersistedAgentPart, PersistedAgentPartType } from '@activepieces/shared'
import { ChatEvalAssertion } from './fixture'
import { AgentTurnResult } from '../../../../src/lib/execute/jobs/ee/agent/run-agent-turn'

const ASKED_HOW_PATTERNS = [
    /\bhow (do|would|should|will|might) (you|we|i)\b/i,
    /\bwhich (field|column|property|trigger|step|action|piece|connection)\b[^?]*\?/i,
    /\bwhat (field|column|property|trigger|step|action)\b[^?]*\?/i,
]

const DEFAULT_QUESTION_CARD_PATTERN = /question|quick_repl/i

const PUBLISH_TOOL_NAME = 'ap_lock_and_publish'

const TURN_IT_ON_PATTERN = /turn (it )?on|publish|go live|activate|enable/i

const LIVE_CLAIM_PATTERNS = [
    /\b(is|it's|it is|now|already|currently) (live|running|active|enabled|published)\b/i,
    /\b(is|are) now (on|turned on)\b/i,
    /\bgoing live\b/i,
]

function assistantText(result: AgentTurnResult): string {
    return result.uiParts
        .filter((part): part is Extract<PersistedAgentPart, { type: PersistedAgentPartType.TEXT }> => part.type === PersistedAgentPartType.TEXT)
        .map((part) => part.text)
        .join('\n')
}

function firstOrder(result: AgentTurnResult, toolName: string): number {
    const match = result.toolCalls.find((call) => call.toolName === toolName)
    return match?.order ?? -1
}

function neverAskedHow(result: AgentTurnResult): AssertionOutcome {
    const text = assistantText(result)
    const matched = ASKED_HOW_PATTERNS.find((pattern) => pattern.test(text))
    return matched
        ? { pass: false, reason: `assistant asked a "how/technical" question matching ${matched}` }
        : { pass: true, reason: 'no how/technical clarifying questions found' }
}

function neverCutOff(result: AgentTurnResult): AssertionOutcome {
    const cutOff = result.truncatedAfterRetries || result.finishReason === 'length'
    return cutOff
        ? { pass: false, reason: `response was cut off (truncatedAfterRetries=${result.truncatedAfterRetries}, finishReason=${result.finishReason})` }
        : { pass: true, reason: 'response completed without truncation' }
}

function noBuildToolBeforePhaseSet(result: AgentTurnResult): AssertionOutcome {
    const violation = result.toolCalls.find((call) => agentToolPhases.isBuildOnlyTool(call.toolName) && call.phase !== 'build')
    return violation
        ? { pass: false, reason: `build-only tool "${violation.toolName}" ran while phase was "${violation.phase}"` }
        : { pass: true, reason: 'all build-only tools ran in the build phase' }
}

function calledBefore(result: AgentTurnResult, a: string, b: string): AssertionOutcome {
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

function reachedToolWithin(result: AgentTurnResult, toolName: string, n: number): AssertionOutcome {
    const order = firstOrder(result, toolName)
    if (order === -1) {
        return { pass: false, reason: `"${toolName}" was never called` }
    }
    return order <= n
        ? { pass: true, reason: `"${toolName}" reached at order ${order} (<= ${n})` }
        : { pass: false, reason: `"${toolName}" first reached at order ${order} (> ${n})` }
}

function maxQuestionCards(result: AgentTurnResult, n: number, toolNames?: string[]): AssertionOutcome {
    const count = result.toolCalls.filter((call) =>
        toolNames ? toolNames.includes(call.toolName) : DEFAULT_QUESTION_CARD_PATTERN.test(call.toolName),
    ).length
    return count <= n
        ? { pass: true, reason: `${count} question card(s) shown (<= ${n})` }
        : { pass: false, reason: `${count} question card(s) shown (> ${n})` }
}

function neverCalledTool(result: AgentTurnResult, toolName: string): AssertionOutcome {
    return result.toolCalls.some((call) => call.toolName === toolName)
        ? { pass: false, reason: `"${toolName}" was called` }
        : { pass: true, reason: `"${toolName}" was never called` }
}

function noToolArgMatches(result: AgentTurnResult, pattern: string, toolName?: string): AssertionOutcome {
    const regex = new RegExp(pattern, 'i')
    const match = result.toolCalls.find((call) => (toolName === undefined || call.toolName === toolName) && regex.test(JSON.stringify(call.input)))
    return match
        ? { pass: false, reason: `"${match.toolName}" (order ${match.order}) was called with arguments matching /${pattern}/` }
        : { pass: true, reason: `no ${toolName ? `"${toolName}" ` : ''}call had arguments matching /${pattern}/` }
}

function askedToTurnItOn(result: AgentTurnResult): AssertionOutcome {
    const cardOrder = result.toolCalls.find((call) => DEFAULT_QUESTION_CARD_PATTERN.test(call.toolName) && TURN_IT_ON_PATTERN.test(JSON.stringify(call.input)))?.order
    if (cardOrder === undefined) {
        return { pass: false, reason: 'no "Turn it on?" card was shown' }
    }
    const publishedBeforeAsking = result.toolCalls.some((call) => call.toolName === PUBLISH_TOOL_NAME && call.order < cardOrder)
    return publishedBeforeAsking
        ? { pass: false, reason: 'flow was published before the user said yes' }
        : { pass: true, reason: 'a "Turn it on?" card was shown before any publish' }
}

function noLiveClaimWithoutPublish(result: AgentTurnResult): AssertionOutcome {
    const published = result.toolCalls.some((call) => call.toolName === PUBLISH_TOOL_NAME)
    const matched = LIVE_CLAIM_PATTERNS.find((pattern) => pattern.test(assistantText(result)))
    return !published && matched
        ? { pass: false, reason: `claimed the flow is live (${matched}) without calling ${PUBLISH_TOOL_NAME}` }
        : { pass: true, reason: 'no live claim without a publish' }
}

function runAssertion(result: AgentTurnResult, assertion: ChatEvalAssertion): AssertionResult {
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
        case 'neverCalledTool':
            return { type: assertion.type, ...neverCalledTool(result, assertion.toolName) }
        case 'noToolArgMatches':
            return { type: assertion.type, ...noToolArgMatches(result, assertion.pattern, assertion.toolName) }
        case 'askedToTurnItOn':
            return { type: assertion.type, ...askedToTurnItOn(result) }
        case 'noLiveClaimWithoutPublish':
            return { type: assertion.type, ...noLiveClaimWithoutPublish(result) }
    }
}

export const transcriptAssertions = {
    neverAskedHow,
    neverCutOff,
    noBuildToolBeforePhaseSet,
    calledBefore,
    reachedToolWithin,
    maxQuestionCards,
    neverCalledTool,
    noToolArgMatches,
    askedToTurnItOn,
    noLiveClaimWithoutPublish,
    runAssertion,
}

type AssertionOutcome = {
    pass: boolean
    reason: string
}

export type AssertionResult = AssertionOutcome & {
    type: ChatEvalAssertion['type']
}
