import { FlowActionType, Step } from '@activepieces/core-execution'
import { beforeAll, describe, expect, it } from 'vitest'
import { actionEffect } from '../../src/lib/ee/chat/action-effect'
import { actionEffectLabelCatalog } from '../../src/lib/ee/chat/action-effect-labels'
import { chatConsent } from '../../src/lib/ee/chat/chat-consent'
import { chatToolClassification } from '../../src/lib/ee/chat/tool-classification'

beforeAll(() => {
    actionEffect.setCatalog(actionEffectLabelCatalog.load())
})

function pieceStep({ name, pieceName, actionName, input }: {
    name: string
    pieceName: string
    actionName: string
    input?: Record<string, unknown>
}): Step {
    return {
        name,
        displayName: name,
        type: FlowActionType.PIECE,
        valid: true,
        settings: {
            pieceName,
            pieceVersion: '~0.0.1',
            actionName,
            input: input ?? {},
            inputUiInfo: {},
            errorHandlingOptions: {},
        },
    } as unknown as Step
}

function codeStep({ name, code }: { name: string, code: string }): Step {
    return {
        name,
        displayName: name,
        type: FlowActionType.CODE,
        valid: true,
        settings: {
            sourceCode: { code, packageJson: '{}' },
            input: {},
        },
    } as unknown as Step
}

function triggerWith(steps: Step[]): Step {
    return {
        name: 'trigger',
        displayName: 'Every day',
        type: 'PIECE_TRIGGER',
        valid: true,
        nextAction: steps.reduceRight<Step | undefined>((next, step) => ({ ...step, nextAction: next }), undefined),
        settings: { pieceName: '@activepieces/piece-schedule', triggerName: 'every_day', input: {} },
    } as unknown as Step
}

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

describe('chatToolClassification.requiresActionPreview', () => {
    it('consults the catalog when the piece is known', () => {
        expect(chatToolClassification.requiresActionPreview({ pieceName: '@activepieces/piece-mongodb', actionName: 'find_and_replace_documents' })).toBe(true)
        expect(chatToolClassification.requiresActionPreview({ pieceName: '@activepieces/piece-tables', actionName: 'tables-create-records' })).toBe(false)
    })

    it('always honours an explicit request to confirm, even on a tainted turn', () => {
        expect(chatToolClassification.requiresActionPreview({ actionName: 'get_rows', needsConfirmation: true })).toBe(true)
        expect(chatToolClassification.requiresActionPreview({ actionName: 'get_rows', needsConfirmation: true, tainted: true })).toBe(true)
    })

    it('tightens to reads-only on a tainted turn', () => {
        expect(chatToolClassification.requiresActionPreview({ pieceName: '@activepieces/piece-tables', actionName: 'tables-create-records', tainted: true })).toBe(true)
        expect(chatToolClassification.requiresActionPreview({ pieceName: '@activepieces/piece-tables', actionName: 'tables-find-records', tainted: true })).toBe(false)
    })
})

describe('chatToolClassification.flowStepEffects — what a live test would really do', () => {
    it('reports the sending step with its static recipient and stays quiet about internal steps', () => {
        const trigger = triggerWith([
            pieceStep({ name: 'save_row', pieceName: '@activepieces/piece-tables', actionName: 'tables-create-records' }),
            pieceStep({ name: 'notify_me', pieceName: '@activepieces/piece-gmail', actionName: 'send_email', input: { receiver: ['omar@activepieces.com'] } }),
        ])
        const effects = chatToolClassification.flowStepEffects(trigger)
        expect(effects).toHaveLength(1)
        expect(effects[0].stepName).toBe('notify_me')
        expect(effects[0].effect.kind).toBe('outward_send')
        expect(effects[0].recipient).toBe('omar@activepieces.com')
    })

    it('keeps a step that deletes Activepieces data in the preview — a live test must ask first', () => {
        const trigger = triggerWith([
            pieceStep({ name: 'wipe', pieceName: '@activepieces/piece-tables', actionName: 'tables-delete-table' }),
        ])
        const effects = chatToolClassification.flowStepEffects(trigger)
        expect(effects).toHaveLength(1)
        expect(effects[0].effect.kind).toBe('internal_destructive')
        expect(chatConsent.decide({ kind: effects[0].effect.kind })).toBe('ask')
    })

    it('does not guess a templated recipient', () => {
        const trigger = triggerWith([
            pieceStep({ name: 'notify', pieceName: '@activepieces/piece-gmail', actionName: 'send_email', input: { receiver: ['{{trigger.email}}'] } }),
        ])
        expect(chatToolClassification.flowStepEffects(trigger)[0].recipient).toBeUndefined()
    })

    it('treats every code step as unknowable, however harmless it looks', () => {
        const reaching = triggerWith([codeStep({ name: 'push', code: 'export const code = async () => fetch("https://example.com", { method: "POST" })' })])
        const looksPure = triggerWith([codeStep({ name: 'sum', code: 'export const code = async (inputs) => inputs.a + inputs.b' })])
        expect(chatToolClassification.flowStepEffects(reaching)[0].effect.kind).toBe('input_dependent')
        expect(chatToolClassification.flowStepEffects(looksPure)[0].effect.kind).toBe('input_dependent')
    })

    it('does not let code smuggle network reach past a keyword scan', () => {
        const evasive = triggerWith([codeStep({ name: 'exfil', code: 'export const code = async (i) => (()=>{}).constructor("return this")()["fet"+"ch"](i.url, { method: "POST", body: i.secret })' })])
        expect(chatToolClassification.flowStepEffects(evasive)[0].effect.kind).toBe('input_dependent')
    })

    it('catches a raw HTTP step in a flow, which a write-verb name check misses entirely', () => {
        const trigger = triggerWith([
            pieceStep({ name: 'call_api', pieceName: '@activepieces/piece-http', actionName: 'send_request', input: { method: 'POST', url: 'https://example.com' } }),
        ])
        expect(chatToolClassification.flowStepEffects(trigger)).toHaveLength(1)
    })

    it('scopes a single-step test to that step alone', () => {
        const trigger = triggerWith([
            pieceStep({ name: 'read_rows', pieceName: '@activepieces/piece-google-sheets', actionName: 'get_rows' }),
            pieceStep({ name: 'notify_me', pieceName: '@activepieces/piece-gmail', actionName: 'send_email' }),
        ])
        expect(chatToolClassification.stepEffectsForStep({ trigger, stepName: 'read_rows' })).toHaveLength(0)
        expect(chatToolClassification.stepEffectsForStep({ trigger, stepName: 'notify_me' })).toHaveLength(1)
    })

    it('falls back to the whole flow when the step name is unknown', () => {
        const trigger = triggerWith([
            pieceStep({ name: 'notify_me', pieceName: '@activepieces/piece-gmail', actionName: 'send_email' }),
        ])
        expect(chatToolClassification.stepEffectsForStep({ trigger, stepName: 'nope' })).toHaveLength(1)
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

    it('never reuses a yes for a send whose recipient is decided at runtime', () => {
        const staticRecipient = chatToolClassification.flowStepEffects(triggerWith([
            pieceStep({ name: 'notify', pieceName: '@activepieces/piece-gmail', actionName: 'send_email', input: { receiver: ['omar@activepieces.com'] } }),
        ]))
        const templated = chatToolClassification.flowStepEffects(triggerWith([
            pieceStep({ name: 'notify', pieceName: '@activepieces/piece-gmail', actionName: 'send_email', input: { receiver: ['{{trigger.email}}'] } }),
        ]))
        expect(chatToolClassification.stepEffectsReusable(staticRecipient)).toBe(true)
        expect(chatToolClassification.stepEffectsReusable(templated)).toBe(false)
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

    it('changes the fingerprint when the message body is rewritten, so an old yes cannot cover a new message', () => {
        const original = triggerWith([
            pieceStep({ name: 'notify', pieceName: '@activepieces/piece-gmail', actionName: 'send_email', input: { receiver: ['omar@activepieces.com'], subject: 'Daily digest', body_text: 'Here is your digest.' } }),
        ])
        const rewritten = triggerWith([
            pieceStep({ name: 'notify', pieceName: '@activepieces/piece-gmail', actionName: 'send_email', input: { receiver: ['omar@activepieces.com'], subject: 'URGENT: wire money', body_text: 'Completely different message.' } }),
        ])
        const first = chatToolClassification.effectFingerprintsOf(chatToolClassification.flowStepEffects(original))
        const second = chatToolClassification.effectFingerprintsOf(chatToolClassification.flowStepEffects(rewritten))
        expect(first).not.toEqual(second)
    })

    it('fingerprints identical inputs identically', () => {
        const build = () => triggerWith([
            pieceStep({ name: 'notify', pieceName: '@activepieces/piece-gmail', actionName: 'send_email', input: { receiver: ['omar@activepieces.com'], subject: 'Daily digest' } }),
        ])
        const first = chatToolClassification.effectFingerprintsOf(chatToolClassification.flowStepEffects(build()))
        const second = chatToolClassification.effectFingerprintsOf(chatToolClassification.flowStepEffects(build()))
        expect(first).toEqual(second)
    })
})
