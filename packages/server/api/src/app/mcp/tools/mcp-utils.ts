import { PieceMetadataModel, PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework'
import { BranchOperator, EngineResponse, EngineResponseStatus, FlowActionType, flowStructureUtil, isNil, isObject, McpServerType, McpToolResult, ProjectScopedMcpServer, singleValueConditions, tryCatch, WorkerJobType } from '@activepieces/shared'
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

function diagnosePieceProps({ props, input, pieceAuth, requireAuth, componentType }: DiagnosePiecePropsParams): DiagnosisResult {
    const missing: string[] = []
    const uiRequired: string[] = []
    const allProps: string[] = []
    const validPropKeys = new Set<string>()
    for (const [propName, prop] of Object.entries(props)) {
        if (NON_INPUT_PROP_TYPES.has(prop.type)) {
            continue
        }
        validPropKeys.add(propName)
        allProps.push(`${propName} (${prop.type}${prop.required ? ', required' : ''})`)
        if (prop.required) {
            const value = input[propName]
            if (value === undefined || value === null || value === '') {
                if (RESOLVABLE_PROP_TYPES.has(prop.type)) {
                    uiRequired.push(`${propName} (${prop.displayName})`)
                }
                else {
                    const hint = (prop.type === PropertyType.STATIC_DROPDOWN || prop.type === PropertyType.STATIC_MULTI_SELECT_DROPDOWN)
                        ? formatOptionsHint(prop.options?.options)
                        : ''
                    missing.push(`${propName} (${prop.type}${hint})`)
                }
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
        parts.push(`Unknown properties: ${unknownKeys.map((k) => `'${k}'`).join(', ')}. Valid properties for this action are:\n${validPropDescriptions}\nPlease retry with correct property names.`)
    }
    if (missing.length > 0) {
        parts.push(`Missing required inputs: ${missing.join(', ')}.`)
    }
    if (uiRequired.length > 0) {
        parts.push(`These inputs require selection from your account and must be configured in the Activepieces UI: ${uiRequired.join(', ')}.`)
    }
    if (allProps.length > 0 && unknownKeys.length === 0) {
        parts.push(`Expected inputs: ${allProps.join(', ')}.`)
    }
    if (hasAuth && !input.auth) {
        parts.push(`This ${componentType} requires authentication.`)
    }
    return { parts, missing, unknownKeys, uiRequired, hasAuth }
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
        log.warn({ err, pieceName, actionName }, 'fillDefaultsForMissingOptionalProps: failed, skipping defaults')
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

export const mcpUtils = {
    mcpToolError,
    truncate,
    resolveRouterStep,
    routerInvalidWarning,
    publishedFlowWarning,
    diagnosePieceProps,
    buildPropSummaries,
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
    | { piece: PieceMetadataModel, component: { props: PiecePropertyMap, requireAuth: boolean, name: string, displayName: string, description: string }, pieceName: string, error?: never }
    | { error: McpToolResult, piece?: never, component?: never, pieceName?: never }

type ResolveRouterStepResult =
    | { routerStep: RouterAction, error?: never }
    | { error: McpToolResult, routerStep?: never }

type ResolveLatestPieceVersionResult =
    | { pieceVersion: string, normalizedPieceName: string, error?: never }
    | { error: McpToolResult, pieceVersion?: never, normalizedPieceName?: never }
