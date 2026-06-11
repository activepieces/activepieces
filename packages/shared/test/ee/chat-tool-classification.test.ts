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
