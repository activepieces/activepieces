import { describe, expect, it } from 'vitest'
import { chatConsentPolicy } from '../../src/lib/ee/chat/consent-policy-settings'

describe('chatConsentPolicy.effectiveFullAccessAllowedFor', () => {
    it('defaults to everyone when nothing is configured', () => {
        expect(chatConsentPolicy.effectiveFullAccessAllowedFor({ settings: undefined })).toBe('everyone')
        expect(chatConsentPolicy.effectiveFullAccessAllowedFor({ settings: null })).toBe('everyone')
        expect(chatConsentPolicy.effectiveFullAccessAllowedFor({ settings: {} })).toBe('everyone')
    })

    it('reads the legacy boolean as nobody, so an admin who turned full access off stays protected', () => {
        expect(chatConsentPolicy.effectiveFullAccessAllowedFor({ settings: { fullAccessEnabled: false } })).toBe('nobody')
        expect(chatConsentPolicy.effectiveFullAccessAllowedFor({ settings: { fullAccessEnabled: true } })).toBe('everyone')
    })

    it('lets the explicit field win over the legacy boolean', () => {
        expect(chatConsentPolicy.effectiveFullAccessAllowedFor({ settings: { fullAccessEnabled: false, fullAccessAllowedFor: 'admins_only' } })).toBe('admins_only')
        expect(chatConsentPolicy.effectiveFullAccessAllowedFor({ settings: { fullAccessEnabled: true, fullAccessAllowedFor: 'nobody' } })).toBe('nobody')
    })
})

describe('chatConsentPolicy.fullAccessPermitted', () => {
    it.each([
        ['everyone', 'ADMIN', true],
        ['everyone', 'MEMBER', true],
        ['everyone', 'OPERATOR', true],
        ['admins_only', 'ADMIN', true],
        ['admins_only', 'MEMBER', false],
        ['admins_only', 'OPERATOR', false],
        ['nobody', 'ADMIN', false],
        ['nobody', 'MEMBER', false],
    ] as const)('allowedFor=%s role=%s -> %s', (allowedFor, platformRole, expected) => {
        expect(chatConsentPolicy.fullAccessPermitted({ settings: { fullAccessAllowedFor: allowedFor }, platformRole })).toBe(expected)
    })

    it('never treats an unknown role string as an admin', () => {
        expect(chatConsentPolicy.fullAccessPermitted({ settings: { fullAccessAllowedFor: 'admins_only' }, platformRole: 'admin' })).toBe(false)
        expect(chatConsentPolicy.fullAccessPermitted({ settings: { fullAccessAllowedFor: 'admins_only' }, platformRole: '' })).toBe(false)
    })
})
