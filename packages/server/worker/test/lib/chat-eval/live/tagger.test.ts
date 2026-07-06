import { PersistedChatPartType, PersistedChatRole, PersistedToolCallStatus } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { LiveScenario } from './scenarios'
import { liveTagger } from './tagger'

function scenario(overrides: Partial<LiveScenario> = {}): LiveScenario {
    return { id: 'test', prompt: 'do a thing', shape: 'well-specified', expectsExecution: true, ...overrides }
}

function toolCall({ toolName, input = {}, actionName, pieceName, outputText = '', status = PersistedToolCallStatus.COMPLETED }: {
    toolName: string
    input?: Record<string, unknown>
    actionName?: string
    pieceName?: string
    outputText?: string
    status?: PersistedToolCallStatus
}): Record<string, unknown> {
    const fullInput = { ...input, ...(actionName ? { actionName } : {}), ...(pieceName ? { pieceName } : {}) }
    return { type: PersistedChatPartType.TOOL_CALL, toolCallId: toolName, toolName, input: fullInput, status, output: { content: [{ type: 'text', text: outputText }] } }
}

function assistant(parts: Array<Record<string, unknown>>): Record<string, unknown> {
    return { role: PersistedChatRole.ASSISTANT, parts }
}

describe('liveTagger.tag', () => {
    it('scores a clean discovery→execute success', () => {
        const uiMessages = [assistant([
            toolCall({ toolName: 'ap_research_pieces' }),
            toolCall({ toolName: 'ap_get_piece_props', input: { pieceName: 'gmail', actionOrTriggerName: 'send_email' } }),
            toolCall({ toolName: 'ap_execute_action', outputText: '✅ Send Email completed' }),
        ])]
        const score = liveTagger.tag({ scenario: scenario(), uiMessages })

        expect(score.totalToolCalls).toBe(3)
        expect(score.discoveryCalls).toBe(2)
        expect(score.hopsBeforeFirstExecute).toBe(2)
        expect(score.executed).toBe(true)
        expect(score.executeSucceeded).toBe(true)
        expect(score.gaveUp).toBe(false)
        expect(score.badArgRejections).toBe(0)
    })

    it('counts schema re-fetches, bad-arg rejections, and the breaker hit', () => {
        const uiMessages = [assistant([
            toolCall({ toolName: 'ap_get_piece_props', input: { pieceName: 'slack', actionOrTriggerName: 'send_message' } }),
            toolCall({ toolName: 'ap_resolve_property_options', input: { propertyName: 'channel' } }),
            toolCall({ toolName: 'ap_get_piece_props', input: { pieceName: 'slack', actionOrTriggerName: 'send_message' } }),
            toolCall({ toolName: 'ap_execute_action', outputText: '❌ Cannot run action: missing required field channel', status: PersistedToolCallStatus.ERROR }),
            toolCall({ toolName: 'ap_execute_action', outputText: '✋ This exact ap_execute_action call already failed 2 times' }),
        ])]
        const score = liveTagger.tag({ scenario: scenario({ shape: 'dynamic-dropdown' }), uiMessages })

        expect(score.schemaRefetches).toBe(1)
        expect(score.badArgRejections).toBe(1)
        expect(score.breakerHits).toBe(1)
        expect(score.executeSucceeded).toBe(false)
        expect(score.gaveUp).toBe(true)
    })

    it('classifies an auth/connection failure separately from a bad-arg failure', () => {
        const uiMessages = [assistant([
            toolCall({ toolName: 'ap_execute_action', outputText: '❌ Action failed: 401 unauthorized — reconnect the connection', status: PersistedToolCallStatus.ERROR }),
        ])]
        const score = liveTagger.tag({ scenario: scenario(), uiMessages })

        expect(score.authBlocked).toBe(1)
        expect(score.badArgRejections).toBe(0)
    })

    it('marks a turn that ends at the connection picker as blocked, not gave-up', () => {
        const uiMessages = [assistant([
            toolCall({ toolName: 'ap_research_pieces' }),
            toolCall({ toolName: 'ap_get_piece_props', input: { pieceName: 'slack', actionOrTriggerName: 'send_message' } }),
            toolCall({ toolName: 'ap_show_connection_picker' }),
        ])]
        const score = liveTagger.tag({ scenario: scenario({ shape: 'dynamic-dropdown' }), uiMessages })
        expect(score.outcome).toBe('blocked-connection')
        expect(score.blockedOnConnection).toBe(true)
        expect(score.gaveUp).toBe(false)
        expect(score.executeSucceeded).toBe(false)
    })

    it('counts built-in ap_send_email and ap_run_code as real work, not stuck', () => {
        const email = liveTagger.tag({
            scenario: scenario(),
            uiMessages: [assistant([toolCall({ toolName: 'ap_send_email', outputText: '✅ Email sent' })])],
        })
        expect(email.outcome).toBe('did-work')
        expect(email.gaveUp).toBe(false)

        const code = liveTagger.tag({
            scenario: scenario({ shape: 'native-code', native: 'code' }),
            uiMessages: [assistant([toolCall({ toolName: 'ap_run_code', outputText: '✅ ran' })])],
        })
        expect(code.outcome).toBe('did-work')
    })

    it('flags wrong instrument when an enumerate intent only used a find-one action', () => {
        const wrong = liveTagger.tag({
            scenario: scenario({ shape: 'dynamic-schema', expectEnumerate: true }),
            uiMessages: [assistant([toolCall({ toolName: 'ap_explore_data', actionName: 'find_record', outputText: '✅ done {"found":false,"result":[]}' })])],
        })
        expect(wrong.rightInstrument).toBe(false)

        const right = liveTagger.tag({
            scenario: scenario({ shape: 'dynamic-schema', expectEnumerate: true }),
            uiMessages: [assistant([toolCall({ toolName: 'ap_explore_data', actionName: 'list_records', outputText: '✅ done' })])],
        })
        expect(right.rightInstrument).toBe(true)
    })

    it('grades native handling: code task via ap_run_code, HTTP task via the http piece', () => {
        const code = liveTagger.tag({
            scenario: scenario({ shape: 'native-code', native: 'code' }),
            uiMessages: [assistant([toolCall({ toolName: 'ap_run_code', outputText: '✅ ran' })])],
        })
        expect(code.nativeHandled).toBe(true)

        const http = liveTagger.tag({
            scenario: scenario({ shape: 'native-http', native: 'http' }),
            uiMessages: [assistant([toolCall({ toolName: 'ap_execute_action', pieceName: '@activepieces/piece-http', outputText: '✅ ok' })])],
        })
        expect(http.nativeHandled).toBe(true)

        const missed = liveTagger.tag({
            scenario: scenario({ shape: 'native-http', native: 'http' }),
            uiMessages: [assistant([toolCall({ toolName: 'ap_research_pieces', outputText: 'no piece found' })])],
        })
        expect(missed.nativeHandled).toBe(false)
    })

    it('treats an ACTION_RECEIPT success as goal met even if no execute text is present', () => {
        const uiMessages = [assistant([
            toolCall({ toolName: 'ap_execute_action' }),
            { type: PersistedChatPartType.ACTION_RECEIPT, toolCallId: 'r1', actionDisplayName: 'Send Message', pieceName: 'slack', status: 'success', timestamp: 't' },
        ])]
        const score = liveTagger.tag({ scenario: scenario(), uiMessages })
        expect(score.executeSucceeded).toBe(true)
        expect(score.gaveUp).toBe(false)
    })
})

describe('liveTagger.aggregate', () => {
    it('rolls per-scenario scores into headline totals', () => {
        const a = liveTagger.tag({
            scenario: scenario({ id: 'a' }),
            uiMessages: [assistant([toolCall({ toolName: 'ap_execute_action', outputText: '✅ done' })])],
        })
        const b = liveTagger.tag({
            scenario: scenario({ id: 'b' }),
            uiMessages: [assistant([toolCall({ toolName: 'ap_execute_action', outputText: '❌ Cannot run action: missing field', status: PersistedToolCallStatus.ERROR })])],
        })
        const card = liveTagger.aggregate({ scores: [a, b] })

        expect(card.scenarioCount).toBe(2)
        expect(card.succeededCount).toBe(1)
        expect(card.gaveUpCount).toBe(1)
        expect(card.totalBadArgRejections).toBe(1)
    })
})
