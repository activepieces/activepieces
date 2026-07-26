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
    'internal_destructive',
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
    return policy?.[kind] ?? DEFAULT_CONSENT_POLICY[kind]
}

function describeEffect(kind: ActionEffectKind): string {
    return EFFECT_PHRASES[kind]
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

export const chatConsent = {
    decide: decideConsent,
    describeEffect,
    isReusable: isReusableConsent,
    signature: consentSignature,
    DEFAULT_CONSENT_POLICY,
}

export type ConsentDecision = 'allow' | 'ask' | 'deny'
