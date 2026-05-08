import { PieceMetadataModel, PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework'
import { BranchOperator, FlowActionType, flowStructureUtil, isNil, isObject, McpToolResult, singleValueConditions } from '@activepieces/shared'
import type { RouterAction, Step } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { projectService } from '../../project/project-service'

const NON_INPUT_PROP_TYPES = new Set<PropertyType>([
    PropertyType.OAUTH2,
    PropertyType.SECRET_TEXT,
    PropertyType.BASIC_AUTH,
    PropertyType.CUSTOM_AUTH,
    PropertyType.MARKDOWN,
])

const RESOLVABLE_PROP_TYPES = new Set<PropertyType>([
    PropertyType.DROPDOWN,
    PropertyType.MULTI_SELECT_DROPDOWN,
    PropertyType.DYNAMIC,
])

const STEP_REFERENCE_HINT = 'Use {{stepName.field}} to reference prior steps (no .output. in path).'

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
    for (const [propName, prop] of Object.entries(props)) {
        if (NON_INPUT_PROP_TYPES.has(prop.type)) {
            continue
        }
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
    const hasAuth = pieceAuth !== undefined && pieceAuth !== null && requireAuth
    if (hasAuth && !input.auth) {
        missing.push('auth (connection required — use ap_list_connections)')
    }
    const parts: string[] = []
    if (missing.length > 0) {
        parts.push(`Missing required inputs: ${missing.join(', ')}.`)
    }
    if (uiRequired.length > 0) {
        parts.push(`These inputs require selection from your account and must be configured in the Activepieces UI: ${uiRequired.join(', ')}.`)
    }
    if (allProps.length > 0) {
        parts.push(`Expected inputs: ${allProps.join(', ')}.`)
    }
    if (hasAuth && !input.auth) {
        parts.push(`This ${componentType} requires authentication.`)
    }
    return { parts, missing, uiRequired, hasAuth }
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

async function lookupPieceComponent({ pieceName, componentName, componentType, projectId, log }: LookupPieceComponentParams): Promise<LookupPieceComponentResult> {
    const normalized = normalizePieceName(pieceName)
    if (isNil(normalized)) {
        return { error: mcpToolError('Validation failed', new Error('pieceName is required')) }
    }
    // Resolve platformId so private (CUSTOM) pieces on this platform are findable by
    // every tool that uses this helper (ap_add_step, ap_update_step, ap_get_piece_props,
    // ap_validate_step_config, ap_run_action, etc.).
    const project = await projectService(log).getOneOrThrow(projectId)
    const piece = await pieceMetadataService(log).get({ name: normalized, projectId, platformId: project.platformId })
    if (isNil(piece)) {
        return { error: { content: [{ type: 'text', text: `❌ Piece "${normalized}" not found. Use ap_list_pieces to get valid piece names.` }] } }
    }
    const componentMap = componentType === 'action' ? piece.actions : piece.triggers
    const label = componentType === 'action' ? 'Action' : 'Trigger'
    const component = componentMap[componentName]
    if (isNil(component)) {
        return { error: { content: [{ type: 'text', text: `❌ ${label} "${componentName}" not found in "${normalized}". Available: ${Object.keys(componentMap).join(', ')}` }] } }
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
            firstValue: z.string().min(1, 'firstValue must be a non-empty string or template expression (e.g. {{trigger.field}})').describe('Left-hand value (template expressions like {{step_1.field}} are allowed). Must be non-empty.'),
            operator: z.enum(Object.values(BranchOperator) as [BranchOperator, ...BranchOperator[]]).optional().describe(`Comparison operator. Single-value operators (no secondValue needed): ${SINGLE_VALUE_OPERATORS_HINT}.`),
            secondValue: z.string().min(1, 'secondValue must be a non-empty string when provided').optional().describe('Right-hand value — required (and non-empty) for all operators except single-value ones.'),
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

function withTimeout<T>({ promise, ms }: { promise: Promise<T>, ms: number }): Promise<T> {
    let timer: ReturnType<typeof setTimeout>
    return Promise.race([
        promise.finally(() => clearTimeout(timer)),
        new Promise<never>((_resolve, reject) => {
            timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
        }),
    ])
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
    withTimeout,
    STEP_REFERENCE_HINT,
    BRANCH_CONDITIONS_INPUT_SCHEMA,
}

export type { PropSummary }

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
    projectId: string
    log: FastifyBaseLogger
}

type LookupPieceComponentResult =
    | { piece: PieceMetadataModel, component: { props: PiecePropertyMap, requireAuth: boolean, name: string, displayName: string, description: string }, pieceName: string, error?: never }
    | { error: McpToolResult, piece?: never, component?: never, pieceName?: never }

type ResolveRouterStepResult =
    | { routerStep: RouterAction, error?: never }
    | { error: McpToolResult, routerStep?: never }
