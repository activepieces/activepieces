import { PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework'

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

export { mcpToolError, diagnosePieceProps, AUTH_TYPES as AUTH_PROP_TYPES }

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
