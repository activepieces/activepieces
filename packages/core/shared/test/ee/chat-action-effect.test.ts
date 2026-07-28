import { beforeAll, describe, expect, it } from 'vitest'
import { actionEffect } from '../../src/lib/ee/chat/action-effect'
import { actionEffectLabelCatalog } from '../../src/lib/ee/chat/action-effect-labels'
import { chatConsent } from '../../src/lib/ee/chat/chat-consent'

beforeAll(() => {
    actionEffect.setCatalog(actionEffectLabelCatalog.load())
})

describe('actionEffect.resolve — the catalog covers what a name never could', () => {
    it.each([
        ['@activepieces/piece-google-sheets', 'insert_row', 'external_write'],
        ['@activepieces/piece-gmail', 'send_email', 'outward_send'],
        ['@activepieces/piece-gmail', 'create_draft_reply', 'external_write'],
        ['@activepieces/piece-stripe', 'create_refund', 'financial'],
        ['@activepieces/piece-tables', 'tables-create-records', 'internal_write'],
        ['@activepieces/piece-tables', 'tables-find-records', 'read'],
        ['@activepieces/piece-tables', 'tables-delete-table', 'internal_destructive'],
        ['@activepieces/piece-http', 'send_request', 'input_dependent'],
    ])('%s · %s is %s', (pieceName, actionName, expected) => {
        expect(actionEffect.resolve({ pieceName, actionName }).kind).toBe(expected)
    })

    it.each([
        ['@activepieces/piece-slack', 'sendMessage'],
        ['@activepieces/piece-google-drive', 'deleteFile'],
    ])('classifies camelCase action %s · %s that a separator-split name check cannot see', (pieceName, actionName) => {
        const effect = actionEffect.resolve({ pieceName, actionName })
        expect(actionEffect.isInternal(effect.kind)).toBe(false)
        expect(chatConsent.decide({ kind: effect.kind })).toBe('ask')
    })

    it('falls back to unknown, not to harmless, for an action nobody labeled', () => {
        const effect = actionEffect.resolve({ pieceName: '@activepieces/piece-made-up', actionName: 'frobnicate' })
        expect(effect.kind).toBe('unknown')
        expect(chatConsent.decide({ kind: effect.kind })).toBe('ask')
    })

    it('lets a piece declare its own effect', () => {
        const effect = actionEffect.resolve({ pieceName: '@activepieces/piece-made-up', actionName: 'frobnicate', declaredEffect: 'financial' })
        expect(effect.kind).toBe('financial')
        expect(effect.source).toBe('declared')
    })

    it('trusts a first-party declaration even when the name sounds worse', () => {
        const effect = actionEffect.resolve({ pieceName: '@activepieces/piece-made-up', actionName: 'send_internal_ping', declaredEffect: 'internal_write' })
        expect(effect.kind).toBe('internal_write')
        expect(effect.source).toBe('declared')
    })

    it('uses a declared recipient prop over the catalog one', () => {
        const effect = actionEffect.resolve({ pieceName: '@activepieces/piece-made-up', actionName: 'notify', declaredEffect: 'outward_send', declaredRecipientProp: 'destination' })
        expect(effect.recipientProp).toBe('destination')
    })

    it('escalates an unreviewed internal label whose name clearly implies an external effect', () => {
        actionEffect.setCatalog({ '@activepieces/piece-fake:send_alert': { kind: 'internal_write' } })
        const effect = actionEffect.resolve({ pieceName: '@activepieces/piece-fake', actionName: 'send_alert' })
        expect(effect.kind).toBe('outward_send')
        actionEffect.setCatalog(actionEffectLabelCatalog.load())
    })

    it('never escalates a read label to unknown — absence of evidence is not evidence', () => {
        actionEffect.setCatalog({ '@activepieces/piece-fake:browse-records': { kind: 'read' } })
        expect(actionEffect.resolve({ pieceName: '@activepieces/piece-fake', actionName: 'browse-records' }).kind).toBe('read')
        actionEffect.setCatalog(actionEffectLabelCatalog.load())
    })

    it('does not escalate when the name itself contains a read verb', () => {
        expect(actionEffect.resolve({ pieceName: '@activepieces/piece-ampeco', actionName: 'chargePointRead' }).kind).toBe('read')
        expect(actionEffect.resolve({ pieceName: '@activepieces/piece-aircall', actionName: 'getCall' }).kind).toBe('read')
        expect(actionEffect.resolve({ pieceName: '@activepieces/piece-mollie', actionName: 'search_order' }).kind).toBe('read')
    })

    it('trusts a hand-reviewed catalog entry as-is', () => {
        expect(actionEffect.resolve({ pieceName: '@activepieces/piece-tables', actionName: 'tables-create-records' }).kind).toBe('internal_write')
        expect(actionEffect.resolve({ pieceName: '@activepieces/piece-store', actionName: 'put' }).kind).toBe('internal_write')
    })

    it('keeps a read-only raw HTTP call ungated', () => {
        expect(actionEffect.resolve({ actionName: 'custom_api_call', input: { method: 'GET' } }).kind).toBe('read')
        expect(actionEffect.resolve({ actionName: 'custom_api_call', input: { method: 'POST' } }).kind).toBe('input_dependent')
        expect(actionEffect.resolve({ pieceName: '@activepieces/piece-http', actionName: 'send_request', input: { method: 'GET', url: 'https://api.github.com/repos' } }).kind).toBe('read')
    })

    it('never lets a declared GET reach a webhook trigger URL silently', () => {
        expect(actionEffect.resolve({ actionName: 'custom_api_call', input: { method: 'GET', url: 'https://cloud.activepieces.com/api/v1/webhooks/flow123/draft/sync' } }).kind).toBe('input_dependent')
        expect(actionEffect.resolve({ pieceName: '@activepieces/piece-http', actionName: 'send_request', input: { method: 'GET', url: 'https://x.test/webhook/abc' } }).kind).toBe('input_dependent')
    })

    it('resolves actions the first catalog silently dropped to a comment-parsing bug', () => {
        expect(actionEffect.resolve({ pieceName: '@activepieces/piece-line', actionName: 'push_message' }).kind).toBe('outward_send')
        expect(actionEffect.resolve({ pieceName: '@activepieces/piece-hackernews', actionName: 'fetch_top_stories' }).kind).toBe('read')
        expect(actionEffect.resolve({ pieceName: '@activepieces/piece-workday', actionName: 'hire_employee' }).kind).toBe('external_write')
    })

    it('resolves action names that contain spaces', () => {
        expect(actionEffect.resolve({ pieceName: '@activepieces/piece-woocommerce', actionName: 'Create Coupon' }).kind).toBe('external_write')
        expect(actionEffect.resolve({ pieceName: '@activepieces/piece-woocommerce', actionName: 'Find Coupon' }).kind).toBe('read')
    })

    it('classifies without a catalog only by name, never trusting an empty catalog as safe', () => {
        actionEffect.setCatalog({})
        expect(actionEffect.resolve({ pieceName: '@activepieces/piece-gmail', actionName: 'send_email' }).kind).toBe('outward_send')
        expect(actionEffect.resolve({ pieceName: '@activepieces/piece-gmail', actionName: 'frobnicate' }).kind).toBe('unknown')
        actionEffect.setCatalog(actionEffectLabelCatalog.load())
    })
})

describe('chatConsent', () => {
    it('lets internal work run and asks about everything else', () => {
        expect(chatConsent.decide({ kind: 'read' })).toBe('allow')
        expect(chatConsent.decide({ kind: 'internal_write' })).toBe('allow')
        expect(chatConsent.decide({ kind: 'internal_destructive' })).toBe('ask')
        expect(chatConsent.decide({ kind: 'outward_send' })).toBe('ask')
        expect(chatConsent.decide({ kind: 'financial' })).toBe('ask')
        expect(chatConsent.decide({ kind: 'unknown' })).toBe('ask')
    })

    it('honours an admin policy override', () => {
        expect(chatConsent.decide({ kind: 'financial', policy: { financial: 'deny' } })).toBe('deny')
        expect(chatConsent.decide({ kind: 'external_write', policy: { external_write: 'allow' } })).toBe('allow')
    })

    it('reuses consent for repeat test-and-fix loops but never for money or deletion', () => {
        expect(chatConsent.isReusable(['outward_send', 'external_write'])).toBe(true)
        expect(chatConsent.isReusable(['financial'])).toBe(false)
        expect(chatConsent.isReusable(['destructive'])).toBe(false)
        expect(chatConsent.isReusable(['internal_destructive'])).toBe(false)
        expect(chatConsent.isReusable(['outward_send', 'internal_destructive'])).toBe(false)
        expect(chatConsent.isReusable([])).toBe(false)
    })

    it('changes the signature when the flow gains an effect, so a stale yes cannot cover it', () => {
        const before = chatConsent.signature({ toolName: 'ap_test_flow', scope: 'flow-1', fingerprints: ['save~external_write~sheets · insert_row~'] })
        const after = chatConsent.signature({ toolName: 'ap_test_flow', scope: 'flow-1', fingerprints: ['save~external_write~sheets · insert_row~', 'notify~outward_send~gmail · send_email~omar@x.com'] })
        expect(before).not.toBe(after)
    })

    it('changes the signature when only the recipient changes', () => {
        const toOmar = chatConsent.signature({ toolName: 'ap_test_flow', scope: 'flow-1', fingerprints: ['notify~outward_send~gmail · send_email~omar@x.com'] })
        const toEveryone = chatConsent.signature({ toolName: 'ap_test_flow', scope: 'flow-1', fingerprints: ['notify~outward_send~gmail · send_email~all@x.com'] })
        expect(toOmar).not.toBe(toEveryone)
    })

    it('keeps the signature stable across repeated identical asks', () => {
        const first = chatConsent.signature({ toolName: 'ap_test_flow', scope: 'flow-1', fingerprints: ['a~outward_send~gmail · send_email~o@x', 'b~external_write~sheets · insert_row~'] })
        const second = chatConsent.signature({ toolName: 'ap_test_flow', scope: 'flow-1', fingerprints: ['b~external_write~sheets · insert_row~', 'a~outward_send~gmail · send_email~o@x'] })
        expect(first).toBe(second)
    })
})
