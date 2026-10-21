const CONNECTION_TEMPLATE = /^\{\{connections\['([^']+)'\]\}\}$/

function unwrapExternalId(auth: unknown): string | null {
    if (typeof auth !== 'string' || auth.length === 0) {
        return null
    }
    return auth.match(CONNECTION_TEMPLATE)?.[1] ?? auth
}

function isTemplate(auth: unknown): auth is string {
    return typeof auth === 'string' && CONNECTION_TEMPLATE.test(auth)
}

function wrapExternalId(auth: unknown): string | null {
    if (isTemplate(auth)) {
        return auth
    }
    if (typeof auth !== 'string' || auth.length === 0) {
        return null
    }
    return `{{connections['${auth}']}}`
}

export const connectionTemplate = { unwrapExternalId, isTemplate, wrapExternalId }
