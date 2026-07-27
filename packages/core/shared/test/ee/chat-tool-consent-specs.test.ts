import { describe, expect, it } from 'vitest'
import { chatConsent } from '../../src/lib/ee/chat/chat-consent'
import { chatToolConsentSpecs } from '../../src/lib/ee/chat/tool-consent-specs'

function kindOf(toolName: string): string {
    const spec = chatToolConsentSpecs.specOf(toolName)
    return spec.mode === 'static' ? spec.kind : spec.mode
}

const fullAccess = chatConsent.composePolicy({ fullAccess: true })

function runsWithoutAskingUnderFullAccess(toolName: string): boolean {
    return chatConsent.decide({ kind: kindOf(toolName) as never, policy: fullAccess }) === 'allow'
}

describe('mcp connector tools are classified by what the action says it does', () => {
    it.each([
        ['mcp__stripe__create_refund', 'financial'],
        ['mcp__stripe__charge_card', 'financial'],
        ['mcp__stripe__create_payout', 'financial'],
        ['mcp__attio__delete_record', 'destructive'],
        ['mcp__github__revoke_access', 'destructive'],
    ])('classifies %s as %s so full access cannot wave it through', (toolName, expected) => {
        expect(kindOf(toolName)).toBe(expected)
        expect(runsWithoutAskingUnderFullAccess(toolName)).toBe(false)
    })

    it('keeps an ordinary app change running card-free under full access', () => {
        expect(kindOf('mcp__attio__create_contact')).toBe('external_write')
        expect(runsWithoutAskingUnderFullAccess('mcp__attio__create_contact')).toBe(true)
    })

    it('never drops below an external write, even for a read-looking name', () => {
        expect(kindOf('mcp__attio__list_contacts')).toBe('external_write')
    })

    it('asks about a connector action it cannot identify', () => {
        expect(kindOf('mcp__attio__snooze_conversation')).toBe('unknown')
        expect(runsWithoutAskingUnderFullAccess('mcp__attio__snooze_conversation')).toBe(false)
    })

    it('fails closed on a connector tool name it cannot parse', () => {
        expect(kindOf('mcp__')).toBe('unknown')
        expect(kindOf('mcp__onlyconnector')).toBe('unknown')
    })

    it('leaves first-party tools alone', () => {
        expect(kindOf('ap_delete_table')).toBe('internal_destructive')
        expect(kindOf('ap_totally_new_tool')).toBe('unknown')
    })
})
