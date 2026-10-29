import { isNil } from '@activepieces/core-utils'
import { ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { mcpUtils, PropertyResolutionResult, PropSummary } from './mcp-utils'

async function resolve({ mcp, log, pieceName, actionOrTriggerName, type, propertyChain, auth, currentInput }: ResolveParams): Promise<ResolveResult> {
    const platformId = await mcpUtils.resolvePlatformId({ mcp, log })
    const lookup = await mcpUtils.lookupPieceComponent({
        pieceName,
        componentName: actionOrTriggerName,
        componentType: type,
        projectId: mcp.projectId,
        platformId,
        log,
    })
    if (lookup.error) {
        return lookup.error
    }
    const { piece, component, pieceName: normalized } = lookup
    const missing = propertyChain.find((item) => isNil(component.props[item.propertyName]))
    if (!isNil(missing)) {
        return {
            content: [{ type: 'text', text: `❌ Property "${missing.propertyName}" not found on ${normalized}/${actionOrTriggerName}. Use ap_get_piece_props to see available properties.` }],
        }
    }
    const hasAuth = !isNil(auth) && auth.trim().length > 0
    const resolveOne = async ({ item, input }: { item: ChainItem, input: Record<string, unknown> }): Promise<PropertyResolutionResult> => {
        const result = await mcpUtils.executePropertyResolution({ pieceName: normalized, pieceVersion: piece.version, actionOrTriggerName, propertyName: item.propertyName, searchValue: item.searchValue, input, projectId: mcp.projectId, platformId, log })
        if (result.status === 'failed') {
            log.warn({ error: result.message, piece: { name: normalized } }, 'Property option resolution failed')
        }
        return result
    }
    const resolvedProperties = await walkChain({
        propertyChain,
        initialInput: { ...(currentInput ?? {}), ...(hasAuth ? { auth: `{{connections['${auth}']}}` } : {}) },
        resolveOne,
    })
    return {
        content: [{ type: 'text', text: summarize({ resolvedProperties, needsAuth: !isNil(piece.auth), hasAuth }) }],
        structuredContent: { resolvedProperties },
    }
}

async function walkChain({ propertyChain, initialInput, resolveOne }: {
    propertyChain: ChainItem[]
    initialInput: Record<string, unknown>
    resolveOne: (params: { item: ChainItem, input: Record<string, unknown> }) => Promise<PropertyResolutionResult>
}): Promise<ResolvedProperty[]> {
    const resolved: ResolvedProperty[] = []
    let input = initialInput
    for (const item of propertyChain) {
        const step = isNil(item.selectedValue)
            ? resolveStep({ item, result: await resolveOne({ item, input }) })
            : { resolved: { propertyName: item.propertyName, selectedValue: item.selectedValue, resolved: true }, chosen: { value: item.selectedValue } }
        resolved.push(step.resolved)
        if (isNil(step.chosen)) {
            return resolved
        }
        input = { ...input, [item.propertyName]: step.chosen.value }
    }
    return resolved
}

function resolveStep({ item, result }: { item: ChainItem, result: PropertyResolutionResult }): { resolved: ResolvedProperty, chosen?: { value: unknown } } {
    const { propertyName } = item
    if (result.status === 'failed') {
        return { resolved: { propertyName, options: [], resolved: false, error: `Could not resolve options for "${propertyName}". You may use the user's value directly; it may work at runtime, but the dropdown will appear unset.` } }
    }
    if (result.status === 'dynamic') {
        return { resolved: { propertyName, dynamicFields: mcpUtils.buildPropSummaries(result.props), resolved: true } }
    }
    const choice = propertyOptionMatch.choose({ options: result.options, match: item.match })
    if (!isNil(choice.picked)) {
        return {
            resolved: { propertyName, optionCount: result.options.length, selectedValue: choice.picked.value, selectedLabel: choice.picked.label, pickedBy: choice.reason, resolved: true },
            chosen: { value: choice.picked.value },
        }
    }
    return { resolved: { propertyName, options: choice.candidates.length > 0 ? choice.candidates : result.options, resolved: false } }
}

function summarize({ resolvedProperties, needsAuth, hasAuth }: { resolvedProperties: ResolvedProperty[], needsAuth: boolean, hasAuth: boolean }): string {
    return resolvedProperties.map((rp) => {
        if (rp.error) {
            return `⚠️ ${rp.propertyName}: ${rp.error}`
        }
        if (rp.dynamicFields) {
            return `✅ ${rp.propertyName}: ${rp.dynamicFields.length} dynamic fields:\n${JSON.stringify(rp.dynamicFields)}`
        }
        if (rp.resolved && !isNil(rp.pickedBy)) {
            return `✅ ${rp.propertyName}: picked "${rp.selectedLabel ?? ''}" = ${JSON.stringify(rp.selectedValue)} (${rp.pickedBy === 'only-option' ? 'the only option' : 'best match'} of ${rp.optionCount ?? 0})`
        }
        if (rp.resolved) {
            return `✅ ${rp.propertyName}: selected ${JSON.stringify(rp.selectedValue)}`
        }
        const options = rp.options ?? []
        if (options.length === 0) {
            return `⚠️ ${rp.propertyName}: ${emptyOptionsHint({ needsAuth, hasAuth })}`
        }
        return `⏸ ${rp.propertyName}: ${options.length} options — pick one and pass its "value" (the ID), NOT the "label":\n${JSON.stringify(options)}`
    }).join('\n')
}

function emptyOptionsHint({ needsAuth, hasAuth }: { needsAuth: boolean, hasAuth: boolean }): string {
    if (needsAuth && !hasAuth) {
        return 'no options — this dropdown loads from a connected account. Pass the connection externalId as auth and retry.'
    }
    if (needsAuth) {
        return 'no options — the connection may be wrong/expired or a parent field is unset. If the account truly has none, use the user\'s value directly (the dropdown will appear unset).'
    }
    return 'no options found. You may use the user\'s value directly; the dropdown will appear unset.'
}

function choose({ options, match }: { options: ChainOption[], match: string | undefined }): OptionChoice {
    if (options.length === 1) {
        return { picked: options[0], reason: 'only-option', candidates: [] }
    }
    if (isNil(match) || match.trim().length === 0) {
        return { candidates: [] }
    }
    const needle = normalizeLabel(match)
    const scored = options
        .map((option) => ({ option, score: matchScore({ label: normalizeLabel(option.label), needle }) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
    if (scored.length === 0) {
        return { candidates: [] }
    }
    const [best, runnerUp] = scored
    if (isNil(runnerUp) || best.score > runnerUp.score) {
        return { picked: best.option, reason: 'match', candidates: [] }
    }
    return { candidates: scored.filter((entry) => entry.score === best.score).map((entry) => entry.option) }
}

function matchScore({ label, needle }: { label: string, needle: string }): number {
    if (label.length === 0) {
        return 0
    }
    if (label === needle) {
        return EXACT_MATCH_SCORE
    }
    if (label.includes(needle) || needle.includes(label)) {
        return CONTAINS_MATCH_SCORE
    }
    const words = needle.split(' ').filter((word) => word.length > 1)
    return words.length > 0 && words.every((word) => label.includes(word)) ? WORDS_MATCH_SCORE : 0
}

function normalizeLabel(text: string): string {
    return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

const EXACT_MATCH_SCORE = 3

const CONTAINS_MATCH_SCORE = 2

const WORDS_MATCH_SCORE = 1

export const propertyChainResolver = {
    resolve,
    walkChain,
    summarize,
}

export const propertyOptionMatch = {
    choose,
}

type ResolveParams = {
    mcp: ProjectScopedMcpServer
    log: FastifyBaseLogger
    pieceName: string
    actionOrTriggerName: string
    type: 'action' | 'trigger'
    propertyChain: ChainItem[]
    auth: string | undefined
    currentInput: Record<string, unknown> | undefined
}

type ResolveResult = {
    content: Array<{ type: 'text', text: string }>
    structuredContent?: Record<string, unknown>
    isError?: boolean
}

type ChainItem = {
    propertyName: string
    selectedValue?: unknown
    match?: string
    searchValue?: string
}

type ResolvedProperty = {
    propertyName: string
    options?: Array<{ label: string, value: unknown }>
    optionCount?: number
    dynamicFields?: PropSummary[]
    selectedValue?: unknown
    selectedLabel?: string
    pickedBy?: 'only-option' | 'match'
    resolved: boolean
    error?: string
}

type ChainOption = { label: string, value: unknown }

type OptionChoice = {
    picked?: ChainOption
    reason?: 'only-option' | 'match'
    candidates: ChainOption[]
}
