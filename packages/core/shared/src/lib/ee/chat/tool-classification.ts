import { FlowActionType, flowStructureUtil, Step } from '@activepieces/core-execution'
import { isNil, isObject, spreadIfDefined, tryCatchSync } from '@activepieces/core-utils'
import { ActionEffect, actionEffect, ActionEffectKind } from './action-effect'
import { chatConsent, ConsentDecision } from './chat-consent'

const READ_ACTION_PATTERNS = ['list', 'get', 'search', 'find', 'fetch', 'read', 'count', 'check', 'verify', 'lookup']
const WRITE_ACTION_PATTERNS = ['delete', 'remove', 'send', 'post', 'publish', 'create', 'update', 'write', 'insert', 'reply', 'forward']
const READ_ONLY_HTTP_METHODS = ['GET', 'HEAD', 'OPTIONS']

const FAILURE_TEXT_PREFIXES = ['❌', '⏳']

const RECIPIENT_INPUT_KEYS = ['receiver', 'to', 'recipients', 'recipient', 'to_email', 'send_to', 'email', 'channel', 'channel_id', 'phone_number']
const MAX_RECIPIENTS_ON_CARD = 3

const SILENT_EFFECT_KINDS = new Set<ActionEffectKind>(['read', 'internal_write'])

const CODE_REACHES_OUTSIDE = /\b(fetch|axios|XMLHttpRequest|WebSocket|EventSource|child_process|process|require|eval|Function|globalThis)\b|https?\.(request|get)\b|\bnet\.|\bdns\.|\btls\.|\bimport\s*\(|^\s*import\b/m

function hasFailureTextPrefix(text: string): boolean {
    return FAILURE_TEXT_PREFIXES.some((prefix) => text.startsWith(prefix))
}

function actionNameMatchesPatterns({ actionName, patterns }: { actionName: string, patterns: string[] }): boolean {
    const words = actionName.toLowerCase().split(/[_\-.]/)
    return patterns.some((pattern) => words.includes(pattern))
}

function requiresActionPreview({ pieceName, actionName, input, needsConfirmation, tainted, declaredEffect, policy }: {
    pieceName?: string
    actionName: string
    input?: Record<string, unknown>
    needsConfirmation?: boolean
    tainted?: boolean
    declaredEffect?: string
    policy?: Partial<Record<ActionEffectKind, ConsentDecision>>
}): boolean {
    if (needsConfirmation === true) {
        return true
    }
    const effect = actionEffect.resolve({ pieceName, actionName, input, declaredEffect })
    if (tainted === true) {
        return !actionEffect.isRead(effect.kind)
    }
    return chatConsent.decide({ kind: effect.kind, policy }) !== 'allow'
}

function isReadActionName(actionName: string): boolean {
    return actionNameMatchesPatterns({ actionName, patterns: READ_ACTION_PATTERNS })
        && !actionNameMatchesPatterns({ actionName, patterns: WRITE_ACTION_PATTERNS })
}

function isReadOnlyActionCall({ pieceName, actionName, input }: { pieceName?: string, actionName: string, input?: Record<string, unknown> }): boolean {
    if (actionName === 'custom_api_call' && isNil(pieceName)) {
        const method = typeof input?.['method'] === 'string' ? input['method'].toUpperCase() : undefined
        return !isNil(method) && READ_ONLY_HTTP_METHODS.includes(method)
    }
    return actionEffect.isRead(actionEffect.resolve({ pieceName, actionName, input }).kind)
}

function isWriteActionName(actionName: string): boolean {
    return actionNameMatchesPatterns({ actionName, patterns: WRITE_ACTION_PATTERNS })
}

function readOnlyRejection(actionName: string): { success: false, error: string } {
    return {
        success: false,
        error: `ap_explore_data only runs read-only actions (list/get/search/find/fetch/read/count/check). "${actionName}" looks like a write — use ap_execute_action for changes.`,
    }
}

function renderStaticRecipientValue(value: unknown): string | undefined {
    if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed.length > 0 && !trimmed.includes('{{') ? trimmed : undefined
    }
    if (Array.isArray(value) && value.length > 0) {
        const items = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0 && !item.includes('{{'))
        if (items.length !== value.length) {
            return undefined
        }
        const shown = items.slice(0, MAX_RECIPIENTS_ON_CARD).join(', ')
        return items.length > MAX_RECIPIENTS_ON_CARD
            ? `${shown} (+${items.length - MAX_RECIPIENTS_ON_CARD} more)`
            : shown
    }
    return undefined
}

function deriveStaticRecipient({ input, recipientProp }: { input?: Record<string, unknown>, recipientProp?: string }): string | undefined {
    if (isNil(input)) {
        return undefined
    }
    const keys = isNil(recipientProp) ? RECIPIENT_INPUT_KEYS : [recipientProp, ...RECIPIENT_INPUT_KEYS]
    for (const key of keys) {
        const rendered = renderStaticRecipientValue(input[key])
        if (!isNil(rendered)) {
            return rendered
        }
    }
    return undefined
}

function stableStringify(value: unknown): string {
    if (Array.isArray(value)) {
        return `[${value.map(stableStringify).join(',')}]`
    }
    if (typeof value === 'object' && value !== null) {
        const entries = Object.entries(value as Record<string, unknown>)
            .filter(([key]) => key !== 'auth')
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
        return `{${entries.join(',')}}`
    }
    return JSON.stringify(value) ?? 'undefined'
}

function inputDigestOf(input: unknown): string {
    const text = stableStringify(input)
    let hash = 0x811c9dc5
    for (let index = 0; index < text.length; index++) {
        hash ^= text.charCodeAt(index)
        hash = Math.imul(hash, 0x01000193)
    }
    return (hash >>> 0).toString(36)
}

function declaresDependencies(packageJson: string | undefined): boolean {
    if (isNil(packageJson) || packageJson.trim().length === 0) {
        return false
    }
    const parsed: unknown = JSON.parse(packageJson.trim().startsWith('{') ? packageJson : '{}')
    if (!isObject(parsed)) {
        return false
    }
    const dependencies = parsed['dependencies']
    return isObject(dependencies) && Object.keys(dependencies).length > 0
}

function codeEffect({ code, packageJson, stepName, displayName }: { code: string, packageJson?: string, stepName: string, displayName: string }): StepEffect {
    const dependencies = tryCatchSync(() => declaresDependencies(packageJson))
    const reachesOutside = CODE_REACHES_OUTSIDE.test(code) || dependencies.data !== false
    return {
        stepName,
        displayName,
        effect: { kind: reachesOutside ? 'input_dependent' : 'internal_write', source: 'heuristic' },
        detail: reachesOutside ? 'custom code that can reach outside' : 'custom code, self-contained',
        inputDigest: inputDigestOf(code),
        opaque: reachesOutside,
    }
}

function codeStepEffect(step: Step): StepEffect {
    return codeEffect({
        code: typeof step.settings.sourceCode?.code === 'string' ? step.settings.sourceCode.code : '',
        packageJson: typeof step.settings.sourceCode?.packageJson === 'string' ? step.settings.sourceCode.packageJson : undefined,
        stepName: step.name,
        displayName: step.displayName,
    })
}

function stepEffectOf({ step, declaredEffect, declaredRecipientProp }: {
    step: Step
    declaredEffect?: string
    declaredRecipientProp?: string
}): StepEffect {
    if (step.type === FlowActionType.CODE) {
        return codeStepEffect(step)
    }
    if (step.type !== FlowActionType.PIECE || typeof step.settings.actionName !== 'string') {
        return {
            stepName: step.name,
            displayName: step.displayName,
            effect: { kind: 'read', source: 'fallback' },
            detail: 'no effect outside Activepieces',
            inputDigest: inputDigestOf(undefined),
            opaque: false,
        }
    }
    const pieceName = typeof step.settings.pieceName === 'string' ? step.settings.pieceName : undefined
    const actionName = step.settings.actionName
    const effect = actionEffect.resolve({
        pieceName,
        actionName,
        input: step.settings.input,
        ...spreadIfDefined('declaredEffect', declaredEffect),
        ...spreadIfDefined('declaredRecipientProp', declaredRecipientProp),
    })
    const pieceLabel = isNil(pieceName) ? '' : pieceName.replace('@activepieces/piece-', '')
    const recipient = deriveStaticRecipient({ input: step.settings.input, recipientProp: effect.recipientProp })
    return {
        stepName: step.name,
        displayName: step.displayName,
        effect,
        detail: pieceLabel.length > 0 ? `${pieceLabel} · ${actionName}` : actionName,
        inputDigest: inputDigestOf(step.settings.input),
        ...(isNil(recipient) ? {} : { recipient }),
        opaque: effect.kind === 'input_dependent',
    }
}

function flowStepEffects(trigger: Step): StepEffect[] {
    return flowStructureUtil.getAllSteps(trigger)
        .map((step) => stepEffectOf({ step }))
        .filter((step) => !SILENT_EFFECT_KINDS.has(step.effect.kind))
}

function stepEffectsForStep({ trigger, stepName }: { trigger: Step, stepName: string }): StepEffect[] {
    const target = flowStructureUtil.getAllSteps(trigger).find((step) => step.name === stepName)
    if (isNil(target)) {
        return flowStepEffects(trigger)
    }
    const effect = stepEffectOf({ step: target })
    return SILENT_EFFECT_KINDS.has(effect.effect.kind) ? [] : [effect]
}

function effectKindsOf(steps: StepEffect[]): ActionEffectKind[] {
    return steps.map((step) => step.effect.kind)
}

function effectFingerprintsOf(steps: StepEffect[]): string[] {
    return steps.map((step) => [step.stepName, step.effect.kind, step.detail, step.recipient ?? '', step.inputDigest ?? ''].join('~'))
}

function stepEffectsReusable(steps: StepEffect[]): boolean {
    return chatConsent.isReusable(effectKindsOf(steps))
        && steps.every((step) => step.effect.kind !== 'outward_send' || !isNil(step.recipient))
}

export const chatToolClassification = {
    requiresActionPreview,
    isReadActionName,
    isReadOnlyActionCall,
    isWriteActionName,
    readOnlyRejection,
    hasFailureTextPrefix,
    stepEffectOf,
    codeEffect,
    flowStepEffects,
    stepEffectsForStep,
    effectKindsOf,
    effectFingerprintsOf,
    stepEffectsReusable,
    inputDigestOf,
}

export type StepEffect = {
    stepName: string
    displayName: string
    effect: ActionEffect
    detail: string
    recipient?: string
    inputDigest?: string
    opaque: boolean
}
