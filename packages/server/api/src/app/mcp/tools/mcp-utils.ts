import { PieceMetadataModel, PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework'
import { isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'

const AUTH_TYPES = new Set<PropertyType>([
    PropertyType.OAUTH2,
    PropertyType.SECRET_TEXT,
    PropertyType.BASIC_AUTH,
    PropertyType.CUSTOM_AUTH,
])

const DYNAMIC_PROP_TYPES = new Set<PropertyType>([
    PropertyType.DROPDOWN,
    PropertyType.MULTI_SELECT_DROPDOWN,
    PropertyType.DYNAMIC,
])

function mcpToolError(prefix: string, err: unknown): { content: [{ type: 'text', text: string }] } {
    const message = err instanceof Error ? err.message : String(err)
    return { content: [{ type: 'text', text: `❌ ${prefix}: ${message}` }] }
}

function diagnosePieceProps({ props, input, pieceAuth, requireAuth, componentType }: DiagnosePiecePropsParams): DiagnosisResult {
    const missing: string[] = []
    const uiRequired: string[] = []
    const allProps: string[] = []
    for (const [propName, prop] of Object.entries(props)) {
        if (AUTH_TYPES.has(prop.type)) {
            continue
        }
        allProps.push(`${propName} (${prop.type}${prop.required ? ', required' : ''})`)
        if (prop.required) {
            const value = input[propName]
            if (value === undefined || value === null || value === '') {
                if (DYNAMIC_PROP_TYPES.has(prop.type)) {
                    uiRequired.push(`${propName} (${prop.displayName})`)
                }
                else {
                    missing.push(`${propName} (${prop.type})`)
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

function buildPropSummaries(props: PiecePropertyMap): PropSummary[] {
    return Object.entries(props)
        .filter(([, prop]) => !AUTH_TYPES.has(prop.type))
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
                summary.note = 'Dynamic dropdown — options load from your account via API. Configure in the Activepieces UI, or provide a known value.'
            }
            if (prop.type === PropertyType.DYNAMIC) {
                summary.note = 'Dynamic properties — fields are generated based on other input values. Configure in the Activepieces UI.'
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
    const piece = await pieceMetadataService(log).get({ name: normalized, projectId })
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

export const mcpUtils = { mcpToolError, diagnosePieceProps, buildPropSummaries, normalizePieceName, lookupPieceComponent }

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
    type: string
    required: boolean
    displayName: string
    description?: string
    defaultValue?: unknown
    options?: Array<{ label: string, value: unknown }>
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
    | { error: { content: [{ type: 'text', text: string }] }, piece?: never, component?: never, pieceName?: never }
