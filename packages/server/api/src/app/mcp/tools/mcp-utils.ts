import { isNil, isObject, tryCatch } from '@activepieces/core-utils'
import { AiMetadata, OutputSchema, OutputSchemaField, PieceMetadataModel, PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework'
import { BranchOperator, EngineResponse, EngineResponseStatus, FlowActionType, flowStructureUtil, McpServerType, McpToolResult, ProjectScopedMcpServer, singleValueConditions, WorkerJobType } from '@activepieces/shared'
import type { RouterAction, Step } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { expressionRewriter } from '../../flows/flow-version/migrations/expression-rewriter'
import { getPiecePackageWithoutArchive, pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'

const NON_INPUT_PROP_TYPES = new Set<PropertyType>([
    PropertyType.OAUTH2,
    PropertyType.SECRET_TEXT,
    PropertyType.BASIC_AUTH,
    PropertyType.CUSTOM_AUTH,
    PropertyType.MARKDOWN,
])

const INTERNAL_INPUT_KEYS = new Set(['auth'])

const RESOLVABLE_PROP_TYPES = new Set<PropertyType>([
    PropertyType.DROPDOWN,
    PropertyType.MULTI_SELECT_DROPDOWN,
    PropertyType.DYNAMIC,
])

const STEP_REFERENCE_HINT = 'Reference a prior step\'s output with {{stepName[\'output\'].field}} (output is nested under [\'output\'], e.g. {{trigger[\'output\'].body.email}}, {{send_email[\'output\'].id}}). For a continue-on-failure step\'s error, use {{stepName[\'error\'].message}}.'

function mcpToolError(prefix: string, err: unknown): McpToolResult {
    const entityDetail = extractEntityNotFoundDetail(err)
    if (entityDetail) {
        return { content: [{ type: 'text', text: `❌ ${prefix}: ${entityDetail} not found. Check the ID or name and try again.` }], isError: true }
    }
    const raw = err instanceof Error ? err.message : String(err)
    const message = sanitizeErrorMessage(raw)
    return { content: [{ type: 'text', text: `❌ ${prefix}: ${message}` }], isError: true }
}

function extractEntityNotFoundDetail(err: unknown): string | null {
    if (!isObject(err)) return null
    const error = (err as Record<string, unknown>).error
    if (!isObject(error)) return null
    const typed = error as Record<string, unknown>
    if (typed.code !== 'ENTITY_NOT_FOUND') return null
    if (!isObject(typed.params)) return null
    const params = typed.params as Record<string, unknown>
    if (typeof params.message === 'string') return params.message
    const entityType = typeof params.entityType === 'string' ? params.entityType : null
    const entityId = typeof params.entityId === 'string' ? params.entityId : null
    if (entityType) return `${entityType}${entityId ? ` "${entityId}"` : ''}`
    return entityId ? `"${entityId}"` : null
}

function sanitizeErrorMessage(message: string): string {
    return message
        .replace(/\/root\/codes\/[^\s:)]+/g, '<sandbox>')
        .replace(/\/root\/common\/[^\s:)]+/g, '<internal>')
        .replace(/\/home\/[^\s:)]+node_modules\/[^\s:)]+/g, '<internal>')
        .replace(/node_modules\/\.bun\/[^\s:)]+/g, '<internal>')
}

function formatOptionsHint(options: Array<{ label: string, value: unknown }> | undefined): string {
    if (!options || options.length === 0) {
        return ''
    }
    const values = options.map(o => String(o.value))
    if (values.length > 10) {
        return ` — options: ${values.slice(0, 10).join(', ')}... (${values.length} total)`
    }
    return ` — options: ${values.join(', ')}`
}

function levenshtein(a: string, b: string): number {
    const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array<number>(b.length).fill(0)])
    for (let j = 1; j <= b.length; j++) {
        rows[0][j] = j
    }
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1
            rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost)
        }
    }
    return rows[a.length][b.length]
}

function suggestClosestKey(key: string, validKeys: string[]): string | null {
    const loweredKey = key.toLowerCase()
    const containing = validKeys.find((valid) => {
        const loweredValid = valid.toLowerCase()
        return loweredValid.includes(loweredKey) || loweredKey.includes(loweredValid)
    })
    if (containing) {
        return containing
    }
    const threshold = Math.max(2, Math.floor(key.length / 2))
    let best: string | null = null
    let bestDistance = Infinity
    for (const valid of validKeys) {
        const distance = levenshtein(loweredKey, valid.toLowerCase())
        if (distance < bestDistance) {
            bestDistance = distance
            best = valid
        }
    }
    return best !== null && bestDistance <= threshold ? best : null
}

const EMPTY_CONTAINER_DEFAULTS: Partial<Record<PropertyType, () => unknown>> = {
    [PropertyType.OBJECT]: () => ({}),
    [PropertyType.ARRAY]: () => [],
}

function coerceEmptyContainerInputs({ props, input }: { props: PiecePropertyMap, input: Record<string, unknown> }): Record<string, unknown> {
    const coerced: Record<string, unknown> = { ...input }
    for (const [propName, prop] of Object.entries(props)) {
        const makeDefault = EMPTY_CONTAINER_DEFAULTS[prop.type]
        if (makeDefault === undefined) {
            continue
        }
        const value = coerced[propName]
        const valueProvided = value !== undefined && value !== null && value !== ''
        // An empty free-form bag means "none", so normalize a wrong-shape empty container
        // (`[]` for an OBJECT prop, `{}` for an ARRAY prop) to the prop's type rather than
        // letting validation bounce it.
        const emptyWrongShapeContainer = (prop.type === PropertyType.OBJECT && Array.isArray(value) && value.length === 0)
            || (prop.type === PropertyType.ARRAY && isObject(value) && !Array.isArray(value) && Object.keys(value).length === 0)
        // But a structured ARRAY (one with sub-`properties`) is genuine required data: defaulting an
        // absent one to [] would mask the missing-required diagnosis and run the action with no rows.
        const isStructuredArray = prop.type === PropertyType.ARRAY
            && isObject(prop.properties) && Object.keys(prop.properties).length > 0
        if (emptyWrongShapeContainer || (!valueProvided && !isStructuredArray)) {
            coerced[propName] = makeDefault()
        }
    }
    return coerced
}

function diagnosePieceProps({ props, input, pieceAuth, requireAuth, componentType }: DiagnosePiecePropsParams): DiagnosisResult {
    const missing: string[] = []
    const uiRequired: string[] = []
    const invalidEnums: string[] = []
    const allProps: string[] = []
    const validPropKeys = new Set<string>()
    for (const [propName, prop] of Object.entries(props)) {
        if (NON_INPUT_PROP_TYPES.has(prop.type)) {
            continue
        }
        validPropKeys.add(propName)
        const isStaticDropdown = prop.type === PropertyType.STATIC_DROPDOWN || prop.type === PropertyType.STATIC_MULTI_SELECT_DROPDOWN
        const optionsHint = isStaticDropdown
            ? formatOptionsHint(prop.options?.options)
            : (prop.type === PropertyType.DYNAMIC ? ' — DYNAMIC: resolve sub-fields with ap_get_piece_props' : '')
        allProps.push(`${propName} (${prop.type}${prop.required ? ', required' : ''}${optionsHint})`)
        const value = input[propName]
        const valueProvided = value !== undefined && value !== null && value !== ''
        if (prop.required && !valueProvided) {
            const descriptionHint = prop.description ? ` — ${prop.description}` : ''
            if (RESOLVABLE_PROP_TYPES.has(prop.type)) {
                uiRequired.push(`${propName} (${prop.displayName})${descriptionHint}`)
            }
            else {
                missing.push(`${propName} (${prop.type}${isStaticDropdown ? optionsHint : ''})${descriptionHint}`)
            }
        }
        if (isStaticDropdown && valueProvided && prop.options?.options) {
            const allowed = prop.options.options.map((o) => o.value)
            const provided = Array.isArray(value) ? value : [value]
            const bad = provided.filter((v) => !allowed.some((a) => a === v))
            if (bad.length > 0) {
                invalidEnums.push(`${propName}: ${bad.map((b) => JSON.stringify(b)).join(', ')} not allowed${optionsHint}`)
            }
        }
    }

    const unknownKeys = Object.keys(input).filter((key) => !validPropKeys.has(key) && !INTERNAL_INPUT_KEYS.has(key))

    const hasAuth = pieceAuth !== undefined && pieceAuth !== null && requireAuth
    if (hasAuth && !input.auth) {
        missing.push('auth (connection required — use ap_list_connections)')
    }
    const parts: string[] = []
    if (unknownKeys.length > 0) {
        const validPropDescriptions = Object.entries(props)
            .filter(([, prop]) => !NON_INPUT_PROP_TYPES.has(prop.type))
            .map(([name, prop]) => `- ${name} (${prop.type}): ${prop.description ?? prop.displayName}`)
            .join('\n')
        const suggestions = unknownKeys
            .map((key) => {
                const closest = suggestClosestKey(key, [...validPropKeys])
                return closest ? `'${key}' → did you mean '${closest}'?` : null
            })
            .filter((suggestion): suggestion is string => suggestion !== null)
        const suggestionLine = suggestions.length > 0 ? `\nSuggestions: ${suggestions.join('; ')}.` : ''
        parts.push(`Unknown properties: ${unknownKeys.map((k) => `'${k}'`).join(', ')}.${suggestionLine} Valid properties for this action are:\n${validPropDescriptions}\nPlease retry with correct property names.`)
    }
    if (invalidEnums.length > 0) {
        parts.push(`Invalid option values: ${invalidEnums.join('; ')}. Use one of the listed option values exactly (case-sensitive).`)
    }
    if (missing.length > 0) {
        parts.push(`Missing required inputs: ${missing.join(', ')}.`)
    }
    if (uiRequired.length > 0) {
        parts.push(`These inputs are dropdown/dynamic fields — resolve their values with ap_resolve_property_options (or ap_get_piece_props with auth) and pass the returned value (ID), then retry: ${uiRequired.join(', ')}.`)
    }
    if (allProps.length > 0 && unknownKeys.length === 0) {
        parts.push(`Expected inputs: ${allProps.join(', ')}.`)
    }
    if (hasAuth && !input.auth) {
        parts.push(`This ${componentType} requires authentication.`)
    }
    return { parts, missing, unknownKeys, uiRequired, invalidEnums, hasAuth }
}

async function detectUnknownInputProps({ pieceName, pieceVersion, componentName, componentType, input, platformId, log }: DetectUnknownInputPropsParams): Promise<{ unknownKeys: string[], message: string }> {
    if (!isObject(input) || Object.keys(input).length === 0) {
        return { unknownKeys: [], message: '' }
    }
    try {
        const piece = await pieceMetadataService(log).getOrThrow({ platformId, name: pieceName, version: pieceVersion })
        const component = componentType === 'action' ? piece.actions[componentName] : piece.triggers[componentName]
        if (isNil(component)) {
            return { unknownKeys: [], message: '' }
        }
        const { unknownKeys, parts } = diagnosePieceProps({ props: component.props, input, pieceAuth: piece.auth, requireAuth: component.requireAuth, componentType })
        if (unknownKeys.length === 0) {
            return { unknownKeys: [], message: '' }
        }
        const unknownMessage = parts.find((p) => p.startsWith('Unknown properties:')) ?? `Unknown properties: ${unknownKeys.map((k) => `'${k}'`).join(', ')}.`
        return { unknownKeys, message: unknownMessage }
    }
    catch (err) {
        log.warn({ error: err, piece: { name: pieceName }, componentName }, 'detectUnknownInputProps: failed to fetch piece metadata')
        return { unknownKeys: [], message: '' }
    }
}

async function rejectUnknownInputProps(params: DetectUnknownInputPropsParams): Promise<McpToolResult | null> {
    const { unknownKeys, message } = await detectUnknownInputProps(params)
    if (unknownKeys.length === 0) {
        return null
    }
    return { content: [{ type: 'text', text: `❌ ${message}` }] }
}

const MAX_PROP_DEPTH = 3

function buildPropSummaries(props: PiecePropertyMap, depth = 0): PropSummary[] {
    return Object.entries(props)
        .filter(([, prop]) => !NON_INPUT_PROP_TYPES.has(prop.type))
        .map(([name, prop]) => {
            const summary: PropSummary = {
                name,
                type: prop.type,
                required: prop.required ?? false,
                displayName: prop.displayName ?? name,
            }
            if (prop.description) {
                summary.description = prop.description
            }
            if (prop.defaultValue !== undefined) {
                summary.defaultValue = prop.defaultValue
            }
            if ((prop.type === PropertyType.STATIC_DROPDOWN || prop.type === PropertyType.STATIC_MULTI_SELECT_DROPDOWN) && 'options' in prop && prop.options?.options) {
                summary.options = prop.options.options.map((o: { label: string, value: unknown }) => ({ label: o.label, value: o.value }))
            }
            if (prop.type === PropertyType.DROPDOWN || prop.type === PropertyType.MULTI_SELECT_DROPDOWN) {
                summary.note = 'Resolve with ap_resolve_property_options. Use the returned value (ID), not label.'
            }
            if (prop.type === PropertyType.DYNAMIC) {
                summary.note = 'DYNAMIC — call ap_get_piece_props with auth+input to resolve sub-fields.'
            }
            if (prop.type === PropertyType.ARRAY && 'properties' in prop && isObject(prop.properties) && depth < MAX_PROP_DEPTH) {
                const arraySubProps: PiecePropertyMap = prop.properties
                summary.items = buildPropSummaries(arraySubProps, depth + 1)
            }
            return summary
        })
}

const RESOLUTION_SENTINEL = '<resolve with ap_resolve_property_options>'

function exampleValueForProp(prop: PropSummary): unknown {
    if (prop.options && prop.options.length > 0) {
        return prop.options[0].value
    }
    switch (prop.type) {
        case PropertyType.OBJECT:
        case PropertyType.JSON:
            return {}
        case PropertyType.ARRAY:
            return []
        case PropertyType.CHECKBOX:
            return prop.defaultValue ?? false
        case PropertyType.NUMBER:
            return prop.defaultValue ?? 0
        case PropertyType.DROPDOWN:
        case PropertyType.MULTI_SELECT_DROPDOWN:
            return RESOLUTION_SENTINEL
        case PropertyType.DYNAMIC:
            return prop.dynamicFields && prop.dynamicFields.length > 0
                ? buildExampleInput(prop.dynamicFields)
                : RESOLUTION_SENTINEL
        default:
            return prop.defaultValue ?? `<${prop.displayName}>`
    }
}

function buildExampleInput(props: PropSummary[]): Record<string, unknown> {
    const example: Record<string, unknown> = {}
    for (const prop of props) {
        if (prop.required) {
            example[prop.name] = exampleValueForProp(prop)
        }
    }
    return example
}

function buildRequiredInputs(props: PropSummary[]): { provideNow: string[], needsResolution: string[] } {
    const provideNow: string[] = []
    const needsResolution: string[] = []
    for (const prop of props.filter((p) => p.required)) {
        if (RESOLVABLE_PROP_TYPES.has(prop.type)) {
            needsResolution.push(prop.name)
        }
        else {
            provideNow.push(prop.name)
        }
    }
    return { provideNow, needsResolution }
}

function flattenOutputSchemaFields(fields: OutputSchemaField[], prefix = ''): string[] {
    return fields.flatMap((field) => {
        // Mirror the builder (data-selector / output viewer): the reference path is
        // `value ?? key`. Must be `??`, not `||` — an empty-string value means "the
        // whole parent scope" (root-array wrapper, see the builder's
        // isWholeOutputSchema) and must NOT fall back to the key, or the flattener
        // would invent a path level that doesn't exist in the real output.
        const segment = field.value ?? field.key
        const path = segment === '' ? prefix : (prefix ? `${prefix}.${segment}` : segment)
        if (field.children && field.children.length > 0) {
            return flattenOutputSchemaFields(field.children, path)
        }
        if (field.listItems && field.listItems.length > 0) {
            return flattenOutputSchemaFields(field.listItems, `${path}[]`)
        }
        // A whole-output scalar leaf (value: '' at the root, e.g. an action whose
        // entire output is one URL/string) has no field path to reference — the
        // output itself is the value. Emit nothing, matching
        // deriveFieldPathsFromSample's scalar-root behaviour.
        if (path === '') {
            return []
        }
        const typeHint = field.format ? ` (${field.format})` : ''
        const dynamicNote = field.dynamicKey ? ' (dynamic key)' : ''
        return [`${path}${typeHint}${dynamicNote}`]
    })
}

function deriveFieldPathsFromSample(value: unknown, prefix = ''): string[] {
    if (Array.isArray(value)) {
        return value.length > 0
            ? deriveFieldPathsFromSample(value[0], `${prefix}[]`)
            : (prefix ? [`${prefix}[]`] : [])
    }
    if (value !== null && typeof value === 'object') {
        const entries = Object.entries(value)
        return entries.length > 0
            ? entries.flatMap(([key, val]) => deriveFieldPathsFromSample(val, prefix ? `${prefix}.${key}` : key))
            : (prefix ? [`${prefix} (object)`] : [])
    }
    if (!prefix) {
        return []
    }
    return [`${prefix} (${value === null ? 'null' : typeof value})`]
}

function normalizePieceName(pieceName: string | undefined): string | undefined {
    if (isNil(pieceName)) {
        return undefined
    }
    if (pieceName.startsWith('@')) {
        return pieceName
    }
    const stripped = pieceName.startsWith('piece-') ? pieceName.slice('piece-'.length) : pieceName
    const normalized = stripped.replace(/_/g, '-')
    return `@activepieces/piece-${normalized}`
}

async function lookupPieceComponent({ pieceName, componentName, componentType, projectId, platformId, log }: LookupPieceComponentParams): Promise<LookupPieceComponentResult> {
    const normalized = normalizePieceName(pieceName)
    if (isNil(normalized)) {
        return { error: mcpToolError('Validation failed', new Error('pieceName is required')) }
    }
    // platformId is needed so private (CUSTOM) pieces on this platform are discoverable.
    let resolvedPlatformId: string
    if (!isNil(platformId)) {
        resolvedPlatformId = platformId
    }
    else if (!isNil(projectId)) {
        resolvedPlatformId = (await projectService(log).getOneOrThrow(projectId)).platformId
    }
    else {
        return { error: mcpToolError('Validation failed', new Error('Either platformId or projectId is required to look up a piece')) }
    }
    const piece = await pieceMetadataService(log).get({ name: normalized, projectId, platformId: resolvedPlatformId })
    if (isNil(piece)) {
        return { error: { content: [{ type: 'text', text: `❌ Piece "${normalized}" not found. Use ap_research_pieces to get valid piece names.` }] } }
    }
    const componentMap = componentType === 'action' ? piece.actions : piece.triggers
    const label = componentType === 'action' ? 'Action' : 'Trigger'
    const component = componentMap[componentName]
    if (isNil(component)) {
        const available = Object.keys(componentMap)
        const suggestion = available.find((name) => name.includes(componentName))
        const hint = suggestion ? ` Did you mean "${suggestion}"?` : ''
        return { error: { content: [{ type: 'text', text: `❌ ${label} "${componentName}" not found in "${normalized}".${hint} Available: ${available.join(', ')}` }] } }
    }
    return { piece, component, pieceName: normalized }
}

function findResolvableProps({ props, componentProps, auth, providedInput }: FindResolvablePropsParams): PropSummary[] {
    return props.filter(prop => {
        const propDef = componentProps[prop.name]
        if (isNil(propDef) || !RESOLVABLE_PROP_TYPES.has(prop.type) || !('refreshers' in propDef)) {
            return false
        }
        const refreshers = (propDef as { refreshers: string[] }).refreshers
        return refreshers.every(r => r === 'auth' ? !!auth : providedInput[r] !== undefined)
    })
}

const SINGLE_VALUE_OPERATORS_HINT = singleValueConditions.join(', ')
const BRANCH_CONDITIONS_INPUT_SCHEMA = z.array(
    z.array(
        z.object({
            firstValue: z.string().min(1, 'firstValue must be a non-empty string or template expression (e.g. {{trigger[\'output\'].field}})').describe('Left-hand value (template expressions like {{step_1[\'output\'].field}} are allowed). Must be non-empty.'),
            operator: z.enum(Object.values(BranchOperator) as [BranchOperator, ...BranchOperator[]]).optional().describe(`Comparison operator. Single-value operators (no secondValue needed): ${SINGLE_VALUE_OPERATORS_HINT}.`),
            secondValue: z.string().min(1, 'secondValue must be a non-empty string when provided').optional().describe('Right-hand value (template expressions like {{step_1[\'output\'].field}} are allowed) — required (and non-empty) for all operators except single-value ones.'),
            caseSensitive: z.boolean().optional().describe('For text operators: whether to match case sensitively'),
        }).superRefine((cond, ctx) => {
            if (cond.operator !== undefined
                && !(singleValueConditions as BranchOperator[]).includes(cond.operator)
                && cond.secondValue === undefined) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['secondValue'],
                    message: `secondValue is required when operator is "${cond.operator}". Use a single-value operator (${SINGLE_VALUE_OPERATORS_HINT}) if you do not have a secondValue.`,
                })
            }
            if (cond.operator === undefined && cond.secondValue !== undefined) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['operator'],
                    message: 'operator is required when secondValue is provided — pick a comparison operator (e.g. TEXT_CONTAINS, TEXT_EXACTLY_MATCHES, NUMBER_IS_EQUAL_TO).',
                })
            }
        }),
    ),
)

function truncate(str: string, max: number): string {
    return str.length <= max ? str : str.slice(0, max) + '... (truncated)'
}

function resolveRouterStep({ stepName, trigger }: { stepName: string, trigger: Step }): ResolveRouterStepResult {
    const step = flowStructureUtil.getStep(stepName, trigger)
    if (isNil(step) || step.type !== FlowActionType.ROUTER) {
        const routers = flowStructureUtil.getAllSteps(trigger)
            .filter(s => s.type === FlowActionType.ROUTER)
            .map(s => s.name)
            .join(', ')
        return {
            error: { content: [{ type: 'text', text: `❌ Step "${stepName}" is not a ROUTER step. Available routers: ${routers || 'none'}` }] },
        }
    }
    return { routerStep: step as RouterAction }
}

function routerInvalidWarning({ stepName, trigger }: { stepName: string, trigger: Step }): string {
    const step = flowStructureUtil.getStep(stepName, trigger)
    if (isNil(step) || step.valid) {
        return ''
    }
    return `\n⚠️ The router "${stepName}" is now marked invalid (step.valid=false) — the UI will show "Incomplete" and the flow cannot be published. Inspect the branch conditions with ap_flow_structure: every condition needs a non-empty firstValue, and any non-single-value operator (TEXT_*, NUMBER_*, DATE_*, LIST_CONTAINS/LIST_DOES_NOT_CONTAIN) needs a non-empty secondValue.`
}

function publishedFlowWarning(publishedVersionId: string | null | undefined): string {
    if (isNil(publishedVersionId)) {
        return ''
    }
    return '\n⚠️ This flow is published. Changes apply to the draft only — use ap_lock_and_publish to push them live.'
}

function validateAuth(auth: string | undefined): { content: [{ type: 'text', text: string }] } | null {
    if (auth !== undefined && /['{}\[\]]/.test(auth)) {
        return { content: [{ type: 'text', text: '❌ auth must be a plain externalId with no special characters. Use the exact value from ap_list_connections.' }] }
    }
    return null
}

async function fillDefaultsForMissingOptionalProps({ settings, platformId, log }: {
    settings: Record<string, unknown>
    platformId: string
    log: FastifyBaseLogger
}): Promise<void> {
    const pieceName = settings.pieceName
    const pieceVersion = settings.pieceVersion
    const actionName = settings.actionName
    if (typeof pieceName !== 'string' || typeof pieceVersion !== 'string' || typeof actionName !== 'string') {
        return
    }
    try {
        const piece = await pieceMetadataService(log).getOrThrow({ platformId, name: pieceName, version: pieceVersion })
        const action = piece.actions[actionName]
        if (isNil(action)) {
            return
        }
        const defaults: Record<string, unknown> = {}
        for (const [propName, prop] of Object.entries(action.props)) {
            if (prop.type === PropertyType.ARRAY && !prop.required) {
                defaults[propName] = []
            }
            else if (prop.type === PropertyType.DYNAMIC && !prop.required) {
                defaults[propName] = {}
            }
            else if (prop.type === PropertyType.CHECKBOX && !prop.required) {
                defaults[propName] = prop.defaultValue ?? false
            }
        }
        settings.input = { ...defaults, ...(typeof settings.input === 'object' && settings.input !== null ? settings.input : {}) }
    }
    catch (err) {
        log.warn({ error: err, piece: { name: pieceName }, actionName }, 'fillDefaultsForMissingOptionalProps: failed, skipping defaults')
    }
}

function buildErrorHandlingOptions({ continueOnFailure, retryOnFailure }: {
    continueOnFailure?: boolean
    retryOnFailure?: boolean
}): { continueOnFailure: { value: boolean }, retryOnFailure: { value: boolean } } {
    return {
        continueOnFailure: { value: continueOnFailure ?? false },
        retryOnFailure: { value: retryOnFailure ?? false },
    }
}

async function resolveLatestPieceVersion({ pieceName, projectId, platformId, log }: {
    pieceName: string
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}): Promise<ResolveLatestPieceVersionResult> {
    const normalized = normalizePieceName(pieceName)
    if (isNil(normalized)) {
        return { error: mcpToolError('Validation failed', new Error('pieceName is required')) }
    }
    const piece = await pieceMetadataService(log).get({ name: normalized, projectId, platformId })
    if (isNil(piece)) {
        return { error: { content: [{ type: 'text', text: `❌ Piece "${normalized}" not found. Use ap_research_pieces to get valid piece names.` }] } }
    }
    return { pieceVersion: `~${piece.version}`, normalizedPieceName: normalized }
}

function withTimeout<T>({ promise, ms }: { promise: Promise<T>, ms: number }): Promise<T> {
    let timer: ReturnType<typeof setTimeout>
    return Promise.race([
        promise.finally(() => clearTimeout(timer)),
        new Promise<never>((_resolve, reject) => {
            timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
        }),
    ])
}

async function resolvePlatformId({ mcp, log }: { mcp: ProjectScopedMcpServer, log: FastifyBaseLogger }): Promise<string> {
    if (mcp.platformId) {
        return mcp.platformId
    }
    const project = await projectService(log).getOneOrThrow(mcp.projectId)
    return project.platformId
}

function isProjectScoped(mcp: ProjectScopedMcpServer): boolean {
    return mcp.type === McpServerType.PROJECT
}

function rewriteAllReferences<C = unknown>({ input, loopItems, conditions, trigger }: {
    input?: Record<string, unknown>
    loopItems?: string
    conditions?: C
    trigger: Step
}): { input?: Record<string, unknown>, loopItems?: string, conditions?: C } {
    const stepNames = flowStructureUtil.getAllSteps(trigger).map(s => s.name)
    return {
        input: input ? expressionRewriter.rewriteDeep(input, stepNames, true) : undefined,
        loopItems: loopItems != null ? expressionRewriter.rewriteStepReferences({ input: loopItems, stepNames, idempotent: true }) : loopItems,
        conditions: conditions ? expressionRewriter.rewriteDeep(conditions, stepNames, true) : conditions,
    }
}

function extractOptionsArray(options: unknown): Array<{ label: string, value: unknown }> | null {
    if (Array.isArray(options)) return options

    if (isObject(options)) {
        const obj = options as Record<string, unknown>
        if (Array.isArray(obj.options)) {
            return obj.options as Array<{ label: string, value: unknown }>
        }
    }

    return null
}

const RESOLVE_TIMEOUT_MS = 30_000

async function executePropertyResolution({ pieceName, pieceVersion, actionOrTriggerName, propertyName, auth, input, searchValue, projectId, platformId, log }: {
    pieceName: string
    pieceVersion: string
    actionOrTriggerName: string
    propertyName: string
    auth?: string
    input?: Record<string, unknown>
    searchValue?: string
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}): Promise<PropertyResolutionResult> {
    const piecePackage = await getPiecePackageWithoutArchive(log, platformId, { pieceName, pieceVersion })
    const resolvedInput: Record<string, unknown> = {
        ...(input ?? {}),
        ...(auth ? { auth: `{{connections['${auth}']}}` } : {}),
    }

    const { data: result, error } = await tryCatch(() => withTimeout({
        promise: userInteractionWatcher.submitAndWaitForResponse<EngineResponse<{
            options: Array<{ label: string, value: unknown }> | PiecePropertyMap
            disabled?: boolean
        }>>({
            jobType: WorkerJobType.EXECUTE_PROPERTY,
            platformId,
            projectId,
            flowVersion: undefined,
            propertyName,
            actionOrTriggerName,
            input: resolvedInput,
            sampleData: {},
            searchValue,
            piece: piecePackage,
        }, log),
        ms: RESOLVE_TIMEOUT_MS,
    }))

    if (error || result.status !== EngineResponseStatus.OK || isNil(result.response?.options)) {
        return { status: 'failed', message: error instanceof Error ? error.message : 'Could not resolve options' }
    }

    const { options } = result.response
    const optionsArray = extractOptionsArray(options)
    if (optionsArray !== null) {
        return {
            status: 'options',
            options: optionsArray.map((o) => ({ label: String(o.label ?? ''), value: o.value })),
        }
    }
    if (isObject(options) && !Array.isArray(options)) {
        return { status: 'dynamic', props: options }
    }
    return { status: 'failed', message: 'Unrecognized options format' }
}

// Classify an action by how many records it returns, from its name. This is the signal the agent
// lacks today: it reaches for find_record (one match) when it meant to enumerate, then thrashes on
// the empty result. 'enumerate' = list/search/plural-find; 'single' = find/get one; 'other' = a write
// or anything else. Used to redirect empty-result feedback and to rank actions by intent.
function classifyActionCardinality(actionName: string): ActionCardinality {
    const name = actionName.toLowerCase()
    // 'list'/'search' only signal enumerate as the leading VERB (or '_search' verb) — not when 'list'
    // is a noun mid-name (find_list_entry is a find-ONE). Plural-record suffixes also mean enumerate.
    const isEnumerate = /^(list|search)/.test(name) || /_search(_|$)/.test(name) || /_(records|rows|items|entries|results|messages|contacts|files)$/.test(name)
    if (isEnumerate) {
        return 'enumerate'
    }
    if (/(^|_)(find|get|fetch|read|retrieve|lookup)(_|$)/.test(name)) {
        return 'single'
    }
    return 'other'
}

// A1 — collapse the discovery chain. The agent used to fetch props, then call ap_resolve_property_*
// once per dropdown, then re-fetch dynamic sub-fields — many round-trips. This resolves the WHOLE
// dependent chain in one pass: resolve every currently-resolvable prop, seed each result's first
// option so dependent dropdowns unlock, and repeat until stable. With options + dynamicFields filled,
// buildExampleInput emits a runnable, sentinel-free example. `resolveOne` is injected (the engine call
// in the tool; a fake in tests) so this loop is deterministically unit-testable without the engine.
async function resolveTransitively({ props, componentProps, auth, providedInput, resolveOne, maxIterations = 6 }: {
    props: PropSummary[]
    componentProps: PiecePropertyMap
    auth: string | undefined
    providedInput: Record<string, unknown>
    resolveOne: (params: { prop: PropSummary, input: Record<string, unknown> }) => Promise<PropertyResolutionResult>
    maxIterations?: number
}): Promise<void> {
    const accumulated: Record<string, unknown> = { ...providedInput }
    const resolved = new Set<string>()
    for (let iteration = 0; iteration < maxIterations; iteration++) {
        const batch = findResolvableProps({ props, componentProps, auth, providedInput: accumulated })
            .filter((prop) => !resolved.has(prop.name))
        if (batch.length === 0) {
            break
        }
        await Promise.all(batch.map(async (prop) => {
            resolved.add(prop.name)
            const result = await resolveOne({ prop, input: accumulated })
            if (result.status === 'dynamic') {
                prop.dynamicFields = buildPropSummaries(result.props)
                prop.note = undefined
            }
            else if (result.status === 'options') {
                prop.options = result.options
                prop.note = undefined
                // Seed the first option with a real value so dependent dropdowns unlock next
                // iteration and the example input stays runnable. Skip empty/placeholder options
                // (e.g. a "Select…" sentinel) so dependents don't resolve against a blank value.
                // Never override a value the caller actually provided.
                const seedOption = result.options.find((option) => option.value !== undefined && option.value !== null && option.value !== '')
                if (accumulated[prop.name] === undefined && seedOption !== undefined) {
                    accumulated[prop.name] = prop.type === PropertyType.MULTI_SELECT_DROPDOWN
                        ? [seedOption.value]
                        : seedOption.value
                }
            }
        }))
    }
}

function intentWantsEnumerate(forIntent: string): boolean {
    return /\b(all|every|each|list|show|browse|enumerate|how many|count|total)\b/.test(forIntent.toLowerCase())
}

function tokenizeIntent(intent: string): string[] {
    return [...new Set(intent.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 3 && !INTENT_STOP_WORDS.has(t)))]
}

// Rank a piece's actions by how well they match the user's stated intent, with a CARDINALITY bias:
// when the intent is to enumerate ("show all companies"), promote list/search actions and demote
// find-one ones — so the agent picks list_records over find_record up front instead of thrashing on
// an empty find. Returns up to 5 action names, best first.
function rankActionsByIntent({ actions, forIntent }: { actions: RankableAction[], forIntent: string }): string[] {
    const tokens = tokenizeIntent(forIntent)
    const wantsEnumerate = intentWantsEnumerate(forIntent)
    const cardinalityBonus = (c: ActionCardinality): number => {
        if (!wantsEnumerate) return 0
        if (c === 'enumerate') return 2
        if (c === 'single') return -1
        return 0
    }
    const scored = actions.map((a) => {
        const haystack = `${a.displayName} ${a.description} ${a.aiDescription ?? ''}`.toLowerCase()
        const tokenScore = tokens.reduce((acc, t) => acc + (haystack.includes(t) ? 1 : 0), 0)
        return { name: a.name, score: tokenScore + cardinalityBonus(a.cardinality) }
    })
    return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 5).map((s) => s.name)
}

const INTENT_STOP_WORDS = new Set(['the', 'all', 'any', 'and', 'for', 'with', 'get', 'from', 'into', 'out', 'list', 'show', 'find', 'see', 'view', 'fetch', 'pull'])

export const mcpUtils = {
    classifyActionCardinality,
    rankActionsByIntent,
    resolveTransitively,
    mcpToolError,
    truncate,
    resolveRouterStep,
    routerInvalidWarning,
    publishedFlowWarning,
    diagnosePieceProps,
    coerceEmptyContainerInputs,
    detectUnknownInputProps,
    rejectUnknownInputProps,
    buildPropSummaries,
    buildExampleInput,
    buildRequiredInputs,
    flattenOutputSchemaFields,
    deriveFieldPathsFromSample,
    normalizePieceName,
    lookupPieceComponent,
    findResolvableProps,
    validateAuth,
    fillDefaultsForMissingOptionalProps,
    buildErrorHandlingOptions,
    resolveLatestPieceVersion,
    resolvePlatformId,
    isProjectScoped,
    withTimeout,
    rewriteAllReferences,
    extractOptionsArray,
    executePropertyResolution,
    RESOLVE_TIMEOUT_MS,
    STEP_REFERENCE_HINT,
    BRANCH_CONDITIONS_INPUT_SCHEMA,
}

export type { PropSummary }

export type PropertyResolutionResult =
    | { status: 'options', options: Array<{ label: string, value: unknown }> }
    | { status: 'dynamic', props: PiecePropertyMap }
    | { status: 'failed', message: string }

type FindResolvablePropsParams = {
    props: PropSummary[]
    componentProps: PiecePropertyMap
    auth: string | undefined
    providedInput: Record<string, unknown>
}

type DetectUnknownInputPropsParams = {
    pieceName: string
    pieceVersion: string
    componentName: string
    componentType: 'action' | 'trigger'
    input: unknown
    platformId: string
    log: FastifyBaseLogger
}

type DiagnosePiecePropsParams = {
    props: PiecePropertyMap
    input: Record<string, unknown>
    pieceAuth: unknown
    requireAuth: boolean
    componentType: 'action' | 'trigger'
}

type DiagnosisResult = {
    parts: string[]
    missing: string[]
    unknownKeys: string[]
    uiRequired: string[]
    invalidEnums: string[]
    hasAuth: boolean
}

type PropSummary = {
    name: string
    type: PropertyType
    required: boolean
    displayName: string
    description?: string
    defaultValue?: unknown
    options?: Array<{ label: string, value: unknown }>
    dynamicFields?: PropSummary[]
    items?: PropSummary[]
    note?: string
}

type LookupPieceComponentParams = {
    pieceName: string
    componentName: string
    componentType: 'action' | 'trigger'
    projectId: string | undefined
    platformId?: string
    log: FastifyBaseLogger
}

type LookupPieceComponentResult =
    | { piece: PieceMetadataModel, component: { props: PiecePropertyMap, requireAuth: boolean, name: string, displayName: string, description: string, outputSchema?: OutputSchema, aiMetadata?: AiMetadata, sampleData?: unknown }, pieceName: string, error?: never }
    | { error: McpToolResult, piece?: never, component?: never, pieceName?: never }

type ResolveRouterStepResult =
    | { routerStep: RouterAction, error?: never }
    | { error: McpToolResult, routerStep?: never }

type ResolveLatestPieceVersionResult =
    | { pieceVersion: string, normalizedPieceName: string, error?: never }
    | { error: McpToolResult, pieceVersion?: never, normalizedPieceName?: never }

export type ActionCardinality = 'enumerate' | 'single' | 'other'

export type RankableAction = {
    name: string
    displayName: string
    description: string
    cardinality: ActionCardinality
    aiDescription?: string
}
