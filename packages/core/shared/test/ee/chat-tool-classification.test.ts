import { describe, expect, it } from 'vitest'
import { chatToolClassification } from '../../src/lib/ee/chat/tool-classification'

describe('chatToolClassification.isReadActionName', () => {
    it.each([
        'get_rows',
        'list_channels',
        'search_messages',
        'find_database_item',
        'fetch_contacts',
        'read_row',
        'count_records',
    ])('treats "%s" as a read action', (actionName) => {
        expect(chatToolClassification.isReadActionName(actionName)).toBe(true)
    })

    it.each([
        'send_channel_message',
        'create_database_item',
        'update_row',
        'delete_record',
        'insert_multiple_rows',
        'post_message',
    ])('treats "%s" as NOT a read action', (actionName) => {
        expect(chatToolClassification.isReadActionName(actionName)).toBe(false)
    })

    it('treats an action with both read and write words as NOT read (write wins)', () => {
        expect(chatToolClassification.isReadActionName('get_and_update_row')).toBe(false)
    })

    it('treats an unrecognized action as NOT read', () => {
        expect(chatToolClassification.isReadActionName('do_thing')).toBe(false)
    })
})

describe('chatToolClassification.isWriteActionName', () => {
    it.each([
        'send_channel_message',
        'create_database_item',
        'update_row',
        'delete_record',
        'insert_multiple_rows',
        'post_message',
        'reply_to_email',
        'forward_message',
    ])('treats "%s" as a write action', (actionName) => {
        expect(chatToolClassification.isWriteActionName(actionName)).toBe(true)
    })

    it.each([
        'get_rows',
        'list_channels',
        'search_messages',
        'do_thing',
    ])('treats "%s" as NOT a write action', (actionName) => {
        expect(chatToolClassification.isWriteActionName(actionName)).toBe(false)
    })
})

describe('chatToolClassification.hasFailureTextPrefix', () => {
    it('flags text starting with a failure glyph', () => {
        expect(chatToolClassification.hasFailureTextPrefix('❌ Something went wrong')).toBe(true)
        expect(chatToolClassification.hasFailureTextPrefix('⏳ Waiting for approval')).toBe(true)
    })

    it('does not flag normal output', () => {
        expect(chatToolClassification.hasFailureTextPrefix('Created row 42')).toBe(false)
        expect(chatToolClassification.hasFailureTextPrefix('')).toBe(false)
    })
})

describe('chatToolClassification.requiresActionPreview — custom_api_call', () => {
    it.each(['GET', 'HEAD', 'OPTIONS', 'get', 'head'])('skips the gate for read-only method "%s"', (method) => {
        expect(chatToolClassification.actionConsentDecision({ actionName: 'custom_api_call', input: { method } })).toBe('allow')
    })

    it.each(['POST', 'PUT', 'PATCH', 'DELETE', 'delete'])('requires the gate for mutating method "%s"', (method) => {
        expect(chatToolClassification.actionConsentDecision({ actionName: 'custom_api_call', input: { method } })).not.toBe('allow')
    })

    it('requires the gate when the method is unknown or missing', () => {
        expect(chatToolClassification.actionConsentDecision({ actionName: 'custom_api_call' })).not.toBe('allow')
        expect(chatToolClassification.actionConsentDecision({ actionName: 'custom_api_call', input: {} })).not.toBe('allow')
    })
})

describe('chatToolClassification.requiresActionPreview — taint (untrusted content in turn)', () => {
    it('forces the gate for an action the model marked needsConfirmation:false once tainted', () => {
        expect(chatToolClassification.actionConsentDecision({ pieceName: 'google-sheets', actionName: 'get_rows', needsConfirmation: false })).toBe('allow')
        expect(chatToolClassification.actionConsentDecision({ pieceName: 'google-sheets', actionName: 'get_rows', needsConfirmation: false, tainted: true })).toBe('allow')
        expect(chatToolClassification.actionConsentDecision({ actionName: 'do_thing', needsConfirmation: false, tainted: true })).not.toBe('allow')
    })

    it('gates an unclassifiable action even when the model says it is safe', () => {
        expect(chatToolClassification.actionConsentDecision({ actionName: 'do_thing', needsConfirmation: false })).not.toBe('allow')
    })

    it('still skips the gate for a provably read-only action when tainted', () => {
        expect(chatToolClassification.actionConsentDecision({ actionName: 'get_rows', tainted: true })).toBe('allow')
        expect(chatToolClassification.actionConsentDecision({ actionName: 'custom_api_call', input: { method: 'GET' }, tainted: true })).toBe('allow')
    })

    it('keeps writes gated when tainted', () => {
        expect(chatToolClassification.actionConsentDecision({ actionName: 'send_channel_message', tainted: true })).not.toBe('allow')
    })
})

describe('chatToolClassification.actionConsentDecision — an admin "deny" must not soften into "ask"', () => {
    it('denies rather than asking, even when the model volunteered a confirmation', () => {
        expect(chatToolClassification.actionConsentDecision({
            actionName: 'send_channel_message',
            needsConfirmation: true,
            policy: { outward_send: 'deny' },
        })).toBe('deny')
    })

    it('denies rather than asking when untrusted content is in the turn', () => {
        expect(chatToolClassification.actionConsentDecision({
            actionName: 'send_channel_message',
            tainted: true,
            policy: { outward_send: 'deny' },
        })).toBe('deny')
    })

    it('still asks when the policy asks, and allows what the policy allows', () => {
        expect(chatToolClassification.actionConsentDecision({ actionName: 'send_channel_message' })).toBe('ask')
        expect(chatToolClassification.actionConsentDecision({ actionName: 'send_channel_message', policy: { outward_send: 'allow' } })).toBe('allow')
    })

})

describe('chatToolClassification.codeEffect — code is never assumed harmless', () => {
    it('cannot be talked out of the gate by code that dodges a keyword scan', () => {
        const evasive = 'export const code = async (i) => (()=>{}).constructor("return this")()["fet"+"ch"](i.url)'
        expect(chatToolClassification.codeEffect({ code: evasive, stepName: 'c', displayName: 'c' }).effect.kind).toBe('input_dependent')
    })

    it('gates arithmetic too, because static reading cannot prove what code does', () => {
        const harmless = 'export const code = async (i) => i.a + i.b'
        const effect = chatToolClassification.codeEffect({ code: harmless, stepName: 'c', displayName: 'c' })
        expect(effect.effect.kind).toBe('input_dependent')
        expect(effect.opaque).toBe(true)
    })

    it('says so when the code pulls in outside packages', () => {
        const effect = chatToolClassification.codeEffect({
            code: 'export const code = async () => 1',
            packageJson: '{"dependencies":{"node-fetch":"2.0.0"}}',
            stepName: 'c',
            displayName: 'c',
        })
        expect(effect.detail).toBe('custom code using outside packages')
    })
})
