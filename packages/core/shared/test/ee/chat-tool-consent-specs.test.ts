import { describe, expect, it } from 'vitest'
import { ActionEffectKind } from '../../src/lib/ee/chat/action-effect'
import { chatToolConsentSpecs } from '../../src/lib/ee/chat/tool-consent-specs'

function staticKindOf(toolName: string): ActionEffectKind | undefined {
    const spec = chatToolConsentSpecs.specOf(toolName)
    return spec.mode === 'static' ? spec.kind : undefined
}

describe('mcp connector tools are classified by what the action says it does', () => {
    it.each([
        ['mcp__stripe__create_refund', 'financial'],
        ['mcp__stripe__charge_card', 'financial'],
        ['mcp__stripe__create_payout', 'financial'],
        ['mcp__attio__delete_record', 'destructive'],
        ['mcp__github__revoke_access', 'destructive'],
    ])('classifies %s as %s, which full access never waves through', (toolName, expected) => {
        expect(staticKindOf(toolName)).toBe(expected)
    })

    it('leaves an ordinary app change as an external write', () => {
        expect(staticKindOf('mcp__attio__create_contact')).toBe('external_write')
    })

    it('never drops below an external write, even for a read-looking name', () => {
        expect(staticKindOf('mcp__attio__list_contacts')).toBe('external_write')
    })

    it('cannot identify a connector action nobody named clearly', () => {
        expect(staticKindOf('mcp__attio__snooze_conversation')).toBe('unknown')
    })

    it('reads a connector id containing underscores or hyphens', () => {
        expect(staticKindOf('mcp__my_crm__delete_record')).toBe('destructive')
        expect(staticKindOf('mcp__d290f1ee-6c54-4b01-90e6-d701748f0851__create_refund')).toBe('financial')
    })

    it('fails closed on a connector tool name it cannot parse', () => {
        expect(staticKindOf('mcp__')).toBe('unknown')
        expect(staticKindOf('mcp__onlyconnector')).toBe('unknown')
    })

    it('leaves first-party tools alone', () => {
        expect(staticKindOf('ap_delete_table')).toBe('internal_destructive')
        expect(staticKindOf('ap_totally_new_tool')).toBe('unknown')
        expect(staticKindOf('ap_test_flow')).toBeUndefined()
    })
})
