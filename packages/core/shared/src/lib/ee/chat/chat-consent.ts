import { ActionEffectKind } from './action-effect'

const DEFAULT_CONSENT_POLICY: Record<ActionEffectKind, ConsentDecision> = {
    read: 'allow',
    internal_write: 'allow',
    internal_destructive: 'ask',
    external_write: 'ask',
    outward_send: 'ask',
    destructive: 'ask',
    financial: 'ask',
    input_dependent: 'ask',
    unknown: 'ask',
}

const REUSABLE_EFFECT_KINDS = new Set<ActionEffectKind>([
    'external_write',
    'outward_send',
])

const EFFECT_PHRASES: Record<ActionEffectKind, string> = {
    read: 'reads data',
    internal_write: 'saves inside Activepieces',
    internal_destructive: 'deletes your Activepieces data',
    external_write: 'changes data in a connected app',
    outward_send: 'sends a real message to someone',
    destructive: 'permanently deletes data',
    financial: 'moves money',
    input_dependent: 'does whatever it is handed, so it cannot be known before it runs',
    unknown: 'does something that could not be identified',
}

function decideConsent({ kind, policy }: {
    kind: ActionEffectKind
    policy?: Partial<Record<ActionEffectKind, ConsentDecision>>
}): ConsentDecision {
    const configured: ConsentDecision | undefined = policy?.[kind]
    const fallback: ConsentDecision | undefined = DEFAULT_CONSENT_POLICY[kind]
    return configured ?? fallback ?? 'ask'
}

function describeEffect(kind: ActionEffectKind): string {
    const phrase: string | undefined = EFFECT_PHRASES[kind]
    return phrase ?? EFFECT_PHRASES.unknown
}

function isReusableConsent(kinds: ActionEffectKind[]): boolean {
    return kinds.length > 0 && kinds.every((kind) => REUSABLE_EFFECT_KINDS.has(kind))
}

function consentSignature({ toolName, scope, fingerprints }: {
    toolName: string
    scope: string
    fingerprints: string[]
}): string {
    return `${toolName}|${scope}|${[...new Set(fingerprints)].sort().join(';')}`
}

const FULL_ACCESS_ALLOWED_KINDS: ActionEffectKind[] = ['external_write', 'outward_send']
const ALL_EFFECT_KINDS: ActionEffectKind[] = ['read', 'internal_write', 'internal_destructive', 'external_write', 'outward_send', 'destructive', 'financial', 'input_dependent', 'unknown']

function toConsentKind(value: string): ActionEffectKind | undefined {
    return ALL_EFFECT_KINDS.find((kind) => kind === value)
}

function toConsentDecision(value: string): ConsentDecision | undefined {
    return value === 'allow' || value === 'ask' || value === 'deny' ? value : undefined
}

function composeConsentPolicy({ fullAccess, overrides }: {
    fullAccess: boolean
    overrides?: Record<string, string>
}): Partial<Record<ActionEffectKind, ConsentDecision>> {
    const policy: Partial<Record<ActionEffectKind, ConsentDecision>> = {}
    if (fullAccess) {
        for (const kind of FULL_ACCESS_ALLOWED_KINDS) {
            policy[kind] = 'allow'
        }
    }
    for (const [rawKind, rawDecision] of Object.entries(overrides ?? {})) {
        const kind = toConsentKind(rawKind)
        const decision = toConsentDecision(rawDecision)
        if (kind !== undefined && decision !== undefined) {
            policy[kind] = decision
        }
    }
    return policy
}

export const chatConsent = {
    decide: decideConsent,
    describeEffect,
    isReusable: isReusableConsent,
    signature: consentSignature,
    composePolicy: composeConsentPolicy,
    DEFAULT_CONSENT_POLICY,
}

export type ConsentDecision = 'allow' | 'ask' | 'deny'
