import { isNil } from '@activepieces/core-utils'

const ACTION_EFFECT_KINDS = [
    'read',
    'internal_write',
    'internal_destructive',
    'external_write',
    'outward_send',
    'destructive',
    'financial',
    'input_dependent',
    'unknown',
] as const

const EFFECT_RANK: Record<ActionEffectKind, number> = {
    read: 0,
    internal_write: 1,
    internal_destructive: 2,
    external_write: 3,
    outward_send: 4,
    destructive: 5,
    financial: 6,
    input_dependent: 7,
    unknown: 8,
}

const INTERNAL_EFFECT_KINDS = new Set<ActionEffectKind>(['read', 'internal_write', 'internal_destructive'])
const READ_ONLY_HTTP_METHODS = ['GET', 'HEAD', 'OPTIONS']

const READ_WORDS = ['list', 'listing', 'get', 'search', 'find', 'fetch', 'read', 'count', 'check', 'verify', 'lookup', 'query', 'retrieve', 'describe', 'inspect', 'export', 'download']
const SEND_WORDS = ['send', 'email', 'mail', 'sms', 'message', 'notify', 'notification', 'post', 'publish', 'tweet', 'dm', 'call', 'dial', 'broadcast', 'invite', 'reply', 'forward', 'comment']
const MONEY_WORDS = ['charge', 'pay', 'payment', 'refund', 'payout', 'transfer', 'invoice', 'checkout', 'order', 'subscribe', 'subscription', 'billing']
const DESTRUCTIVE_WORDS = ['delete', 'remove', 'destroy', 'purge', 'wipe', 'drop', 'erase', 'revoke', 'cancel', 'trash']
const WRITE_WORDS = ['create', 'add', 'update', 'edit', 'insert', 'upsert', 'set', 'write', 'save', 'upload', 'import', 'move', 'copy', 'assign', 'archive', 'start', 'stop', 'run', 'execute', 'trigger', 'convert', 'generate', 'mark', 'change', 'append', 'clear', 'reset', 'sync', 'duplicate', 'issue']

const INPUT_DEPENDENT_ACTION_NAMES = new Set([
    'custom_api_call',
    'send_request',
    'send-oauth2-request',
    'run_query',
    'run-query',
    'execute_query',
    'execute_sql',
])

let effectCatalog: Record<string, ActionEffectLabel> = {}

function setEffectCatalog(catalog: Record<string, ActionEffectLabel>): void {
    effectCatalog = catalog
}

function actionNameWords(actionName: string): Set<string> {
    const spaced = actionName.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_\-.]/g, ' ')
    return new Set(spaced.toLowerCase().split(/\s+/).filter((word) => word.length > 0))
}

function matchesAny({ words, patterns }: { words: Set<string>, patterns: string[] }): boolean {
    return patterns.some((pattern) => words.has(pattern))
}

function normalizePieceName(pieceName: string | undefined): string | undefined {
    if (isNil(pieceName) || pieceName.length === 0) {
        return undefined
    }
    return pieceName.startsWith('@activepieces/piece-')
        ? pieceName
        : `@activepieces/piece-${pieceName.replace(/^piece-/, '')}`
}

function toEffectKind(value: string | undefined): ActionEffectKind | undefined {
    return ACTION_EFFECT_KINDS.find((kind) => kind === value)
}

const WEBHOOK_TRIGGER_PATH = /\/webhooks?\//i

function readOnlyHttpRequest(input: Record<string, unknown> | undefined): boolean {
    const method = typeof input?.['method'] === 'string' ? input['method'].toUpperCase() : undefined
    if (isNil(method) || !READ_ONLY_HTTP_METHODS.includes(method)) {
        return false
    }
    const url = typeof input?.['url'] === 'string' ? input['url'] : undefined
    return isNil(url) || !WEBHOOK_TRIGGER_PATH.test(url)
}

function guessEffectKind({ actionName, input }: { actionName: string, input?: Record<string, unknown> }): ActionEffectKind {
    if (INPUT_DEPENDENT_ACTION_NAMES.has(actionName)) {
        return readOnlyHttpRequest(input) ? 'read' : 'input_dependent'
    }
    const words = actionNameWords(actionName)
    if (matchesAny({ words, patterns: MONEY_WORDS })) {
        return 'financial'
    }
    if (matchesAny({ words, patterns: DESTRUCTIVE_WORDS })) {
        return 'destructive'
    }
    if (matchesAny({ words, patterns: SEND_WORDS })) {
        return 'outward_send'
    }
    if (matchesAny({ words, patterns: WRITE_WORDS })) {
        return 'external_write'
    }
    if (matchesAny({ words, patterns: READ_WORDS })) {
        return 'read'
    }
    return 'unknown'
}

function compareEffectKinds({ a, b }: { a: ActionEffectKind, b: ActionEffectKind }): number {
    return EFFECT_RANK[a] - EFFECT_RANK[b]
}

function stricterEffectKind({ a, b }: { a: ActionEffectKind, b: ActionEffectKind }): ActionEffectKind {
    return compareEffectKinds({ a, b }) >= 0 ? a : b
}

function shouldEscalateLabel({ trusted, labelledKind, guessedKind, actionName }: {
    trusted: boolean
    labelledKind: ActionEffectKind
    guessedKind: ActionEffectKind
    actionName: string
}): boolean {
    return !trusted
        && INTERNAL_EFFECT_KINDS.has(labelledKind)
        && !INTERNAL_EFFECT_KINDS.has(guessedKind)
        && guessedKind !== 'unknown'
        && !matchesAny({ words: actionNameWords(actionName), patterns: READ_WORDS })
}

function resolveActionEffect({ pieceName, actionName, input, declaredEffect, declaredRecipientProp }: {
    pieceName?: string
    actionName: string
    input?: Record<string, unknown>
    declaredEffect?: string
    declaredRecipientProp?: string
}): ActionEffect {
    const normalizedPieceName = normalizePieceName(pieceName)
    const catalogEntry = isNil(normalizedPieceName)
        ? undefined
        : effectCatalog[`${normalizedPieceName}:${actionName}`]
    const declaredKind = toEffectKind(declaredEffect)
    const catalogKind = toEffectKind(catalogEntry?.kind)
    const labelledKind = declaredKind ?? catalogKind
    const guessedKind = guessEffectKind({ actionName, input })

    if (isNil(labelledKind)) {
        return { kind: guessedKind, source: guessedKind === 'unknown' ? 'fallback' : 'heuristic' }
    }
    const trusted = !isNil(declaredKind) || catalogEntry?.authoritative === true
    const escalated = shouldEscalateLabel({ trusted, labelledKind, guessedKind, actionName })
        ? stricterEffectKind({ a: labelledKind, b: guessedKind })
        : labelledKind
    const kind = escalated === 'input_dependent' && readOnlyHttpRequest(input) ? 'read' : escalated
    const recipientProp = declaredRecipientProp ?? catalogEntry?.recipientProp
    return {
        kind,
        ...(isNil(recipientProp) ? {} : { recipientProp }),
        source: isNil(declaredKind) ? 'catalog' : 'declared',
    }
}

function isInternalEffect(kind: ActionEffectKind): boolean {
    return INTERNAL_EFFECT_KINDS.has(kind)
}

function isReadEffect(kind: ActionEffectKind): boolean {
    return kind === 'read'
}

export const actionEffect = {
    resolve: resolveActionEffect,
    guess: guessEffectKind,
    isInternal: isInternalEffect,
    isRead: isReadEffect,
    stricter: stricterEffectKind,
    compare: compareEffectKinds,
    setCatalog: setEffectCatalog,
    KINDS: ACTION_EFFECT_KINDS,
}

export type ActionEffectKind = typeof ACTION_EFFECT_KINDS[number]

export type ActionEffectLabel = {
    kind: ActionEffectKind
    recipientProp?: string
    authoritative?: boolean
}

export type ActionEffect = {
    kind: ActionEffectKind
    recipientProp?: string
    source: 'declared' | 'catalog' | 'heuristic' | 'fallback'
}
