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

describe('chatToolClassification.requiresActionPreview', () => {
    it('never requires a preview for custom_api_call, regardless of needsConfirmation', () => {
        expect(chatToolClassification.requiresActionPreview({ actionName: 'custom_api_call' })).toBe(false)
        expect(chatToolClassification.requiresActionPreview({ actionName: 'custom_api_call', needsConfirmation: true })).toBe(false)
    })

    it('requires a preview for write actions', () => {
        expect(chatToolClassification.requiresActionPreview({ actionName: 'send_channel_message' })).toBe(true)
        expect(chatToolClassification.requiresActionPreview({ actionName: 'delete_record' })).toBe(true)
    })

    it('does not require a preview for read actions', () => {
        expect(chatToolClassification.requiresActionPreview({ actionName: 'get_rows' })).toBe(false)
        expect(chatToolClassification.requiresActionPreview({ actionName: 'list_channels' })).toBe(false)
    })

    it('falls back to needsConfirmation for unrecognized actions', () => {
        expect(chatToolClassification.requiresActionPreview({ actionName: 'do_thing' })).toBe(true)
        expect(chatToolClassification.requiresActionPreview({ actionName: 'do_thing', needsConfirmation: false })).toBe(false)
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
        expect(chatToolClassification.requiresActionPreview({ actionName: 'custom_api_call', input: { method } })).toBe(false)
    })

    it.each(['POST', 'PUT', 'PATCH', 'DELETE', 'delete'])('requires the gate for mutating method "%s"', (method) => {
        expect(chatToolClassification.requiresActionPreview({ actionName: 'custom_api_call', input: { method } })).toBe(true)
    })

    it('requires the gate when the method is unknown or missing', () => {
        expect(chatToolClassification.requiresActionPreview({ actionName: 'custom_api_call' })).toBe(true)
        expect(chatToolClassification.requiresActionPreview({ actionName: 'custom_api_call', input: {} })).toBe(true)
    })
})
