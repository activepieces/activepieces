const CONNECTION_TEMPLATE = /^\{\{connections\['([^']+)'\]\}\}$/

function unwrapExternalId(auth: unknown): string | null {
    if (typeof auth !== 'string' || auth.length === 0) {
        return null
    }
    return auth.match(CONNECTION_TEMPLATE)?.[1] ?? auth
}

export const connectionTemplate = { unwrapExternalId }
