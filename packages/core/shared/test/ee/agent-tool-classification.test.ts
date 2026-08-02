import { describe, expect, it } from 'vitest'
import { agentToolClassification } from '../../src/lib/ee/agent/tool-classification'

describe('agentToolClassification.isReadActionName', () => {
    it.each([
        'get_rows',
        'list_channels',
        'search_messages',
        'find_database_item',
        'fetch_contacts',
        'read_row',
        'count_records',
    ])('treats "%s" as a read action', (actionName) => {
        expect(agentToolClassification.isReadActionName(actionName)).toBe(true)
    })

    it.each([
        'send_channel_message',
        'create_database_item',
        'update_row',
        'delete_record',
        'insert_multiple_rows',
        'post_message',
    ])('treats "%s" as NOT a read action', (actionName) => {
        expect(agentToolClassification.isReadActionName(actionName)).toBe(false)
    })

    it('treats an action with both read and write words as NOT read (write wins)', () => {
        expect(agentToolClassification.isReadActionName('get_and_update_row')).toBe(false)
    })

    it('treats an unrecognized action as NOT read', () => {
        expect(agentToolClassification.isReadActionName('do_thing')).toBe(false)
    })
})

describe('agentToolClassification.isWriteActionName', () => {
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
        expect(agentToolClassification.isWriteActionName(actionName)).toBe(true)
    })

    it.each([
        'get_rows',
        'list_channels',
        'search_messages',
        'do_thing',
    ])('treats "%s" as NOT a write action', (actionName) => {
        expect(agentToolClassification.isWriteActionName(actionName)).toBe(false)
    })
})

describe('agentToolClassification.hasFailureTextPrefix', () => {
    it('flags text starting with a failure glyph', () => {
        expect(agentToolClassification.hasFailureTextPrefix('❌ Something went wrong')).toBe(true)
        expect(agentToolClassification.hasFailureTextPrefix('⏳ Waiting for approval')).toBe(true)
    })

    it('does not flag normal output', () => {
        expect(agentToolClassification.hasFailureTextPrefix('Created row 42')).toBe(false)
        expect(agentToolClassification.hasFailureTextPrefix('')).toBe(false)
    })
})

describe('agentToolClassification.requiresActionPreview — custom_api_call', () => {
    it.each(['GET', 'HEAD', 'OPTIONS', 'get', 'head'])('skips the gate for read-only method "%s"', (method) => {
        expect(agentToolClassification.requiresActionPreview({ actionName: 'custom_api_call', input: { method } })).toBe(false)
    })

    it.each(['POST', 'PUT', 'PATCH', 'DELETE', 'delete'])('requires the gate for mutating method "%s"', (method) => {
        expect(agentToolClassification.requiresActionPreview({ actionName: 'custom_api_call', input: { method } })).toBe(true)
    })

    it('requires the gate when the method is unknown or missing', () => {
        expect(agentToolClassification.requiresActionPreview({ actionName: 'custom_api_call' })).toBe(true)
        expect(agentToolClassification.requiresActionPreview({ actionName: 'custom_api_call', input: {} })).toBe(true)
    })
})

describe('agentToolClassification.requiresActionPreview — taint (untrusted content in turn)', () => {
    it('forces the gate for an action the model marked needsConfirmation:false once tainted', () => {
        expect(agentToolClassification.requiresActionPreview({ actionName: 'do_thing', needsConfirmation: false })).toBe(false)
        expect(agentToolClassification.requiresActionPreview({ actionName: 'do_thing', needsConfirmation: false, tainted: true })).toBe(true)
    })

    it('still skips the gate for a provably read-only action when tainted', () => {
        expect(agentToolClassification.requiresActionPreview({ actionName: 'get_rows', tainted: true })).toBe(false)
        expect(agentToolClassification.requiresActionPreview({ actionName: 'custom_api_call', input: { method: 'GET' }, tainted: true })).toBe(false)
    })

    it('keeps writes gated when tainted', () => {
        expect(agentToolClassification.requiresActionPreview({ actionName: 'send_channel_message', tainted: true })).toBe(true)
    })
})
