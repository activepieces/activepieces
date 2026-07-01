import { describe, expect, it } from 'vitest'
import { chatUserIdentity } from '../../../../src/app/ee/chat/chat-user-identity'

describe('chatUserIdentity.buildNote', () => {
    it('includes the user name and email', () => {
        const note = chatUserIdentity.buildNote({ firstName: 'Ash', lastName: 'Sam', email: 'ash@activepieces.com', platformName: null })
        expect(note).toContain('Who you\'re talking to')
        expect(note).toContain('**Ash Sam**')
        expect(note).toContain('ash@activepieces.com')
    })

    it('derives a company hint from a corporate email domain', () => {
        const note = chatUserIdentity.buildNote({ firstName: 'Ash', lastName: 'Sam', email: 'ash@activepieces.com', platformName: null })
        expect(note).toContain('likely the company **Activepieces**')
        expect(note).toContain('activepieces.com')
    })

    it('skips the company hint for generic email providers', () => {
        const note = chatUserIdentity.buildNote({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@gmail.com', platformName: null })
        expect(note).not.toContain('likely the company')
    })

    it('includes the platform brand when provided and omits it when null', () => {
        const withBrand = chatUserIdentity.buildNote({ firstName: 'Ash', lastName: 'Sam', email: 'ash@acme.io', platformName: 'FlowForge' })
        expect(withBrand).toContain('branded **FlowForge**')
        const withoutBrand = chatUserIdentity.buildNote({ firstName: 'Ash', lastName: 'Sam', email: 'ash@acme.io', platformName: null })
        expect(withoutBrand).not.toContain('branded')
    })

    it('falls back gracefully when the name is empty', () => {
        const note = chatUserIdentity.buildNote({ firstName: '', lastName: '', email: 'someone@acme.io', platformName: null })
        expect(note).toContain('the person at **someone@acme.io**')
    })
})
