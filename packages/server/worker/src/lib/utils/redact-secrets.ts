import { isObject, tryCatchSync } from '@activepieces/core-utils'

function redactValue(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(redactValue)
    }
    if (!isObject(value)) {
        return value
    }
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, isSecretKey(key) ? REDACTED : redactValue(nested)]))
}

function redactJsonText(text: string): unknown {
    const { data, error } = tryCatchSync((): unknown => JSON.parse(text))
    if (error !== null) {
        return { unparsable: true, length: text.length }
    }
    return redactValue(data)
}

function isSecretKey(key: string): boolean {
    return SECRET_KEYS.includes(key.toLowerCase())
}

const REDACTED = '[REDACTED]'

const SECRET_KEYS = ['auth', 'authfields', 'password', 'token', 'secret', 'apikey', 'api_key', 'accesstoken', 'access_token', 'refreshtoken', 'refresh_token', 'clientsecret', 'client_secret', 'credentials']

export const redactSecrets = {
    value: redactValue,
    jsonText: redactJsonText,
    REDACTED,
}
