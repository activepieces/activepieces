import { FlowActionType, Step } from '@activepieces/core-execution'
import { describe, expect, it } from 'vitest'
import { actionEffect } from '../../src/lib/ee/chat/action-effect'
import { chatConsent } from '../../src/lib/ee/chat/chat-consent'
import { chatToolClassification } from '../../src/lib/ee/chat/tool-classification'

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

    it('ignores a declaration that claims to be safer than the action name implies', () => {
        const effect = actionEffect.resolve({ pieceName: '@activepieces/piece-made-up', actionName: 'send_invoice_email', declaredEffect: 'read' })
        expect(effect.kind).not.toBe('read')
        expect(chatConsent.decide({ kind: effect.kind })).toBe('ask')
    })

    it('keeps a read-only raw HTTP call ungated', () => {
        expect(actionEffect.resolve({ actionName: 'custom_api_call', input: { method: 'GET' } }).kind).toBe('read')
        expect(actionEffect.resolve({ actionName: 'custom_api_call', input: { method: 'POST' } }).kind).toBe('input_dependent')
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

    it('does not guess a templated recipient', () => {
        const trigger = triggerWith([
            pieceStep({ name: 'notify', pieceName: '@activepieces/piece-gmail', actionName: 'send_email', input: { receiver: ['{{trigger.email}}'] } }),
        ])
        expect(chatToolClassification.flowStepEffects(trigger)[0].recipient).toBeUndefined()
    })

    it('treats a code step that can reach the network as unknowable, and a pure one as internal', () => {
        const reaching = triggerWith([codeStep({ name: 'push', code: 'export const code = async () => fetch("https://example.com", { method: "POST" })' })])
        const pure = triggerWith([codeStep({ name: 'sum', code: 'export const code = async (inputs) => inputs.a + inputs.b' })])
        expect(chatToolClassification.flowStepEffects(reaching)[0].effect.kind).toBe('input_dependent')
        expect(chatToolClassification.flowStepEffects(pure)).toHaveLength(0)
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

    it('fingerprints a flow down to the step, effect and recipient', () => {
        const effects = chatToolClassification.flowStepEffects(triggerWith([
            pieceStep({ name: 'notify_me', pieceName: '@activepieces/piece-gmail', actionName: 'send_email', input: { receiver: ['omar@activepieces.com'] } }),
        ]))
        expect(chatToolClassification.effectFingerprintsOf(effects)).toEqual([
            'notify_me~outward_send~gmail · send_email~omar@activepieces.com',
        ])
    })
})
