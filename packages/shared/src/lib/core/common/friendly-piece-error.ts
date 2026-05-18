import { isNil, isString } from './utils/utils'

const FRIENDLY_PIECE_ERROR_VERSION = 1

const STACK_LINE_REGEX = /\n\s*at\s+.+$/gm
const HTTP_ERROR_MESSAGE_MAX_LENGTH = 2000

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
    return !isNil(value) && typeof value === 'object' && !Array.isArray(value)
}

const safeJsonParse = (value: string): unknown => {
    try {
        return JSON.parse(value)
    }
    catch {
        return value
    }
}

const stripStack = (value: string): string => {
    return value.replace(STACK_LINE_REGEX, '').trim()
}

const truncate = (value: string): string => {
    if (value.length <= HTTP_ERROR_MESSAGE_MAX_LENGTH) {
        return value
    }
    return `${value.slice(0, HTTP_ERROR_MESSAGE_MAX_LENGTH)}…`
}

const HTML_DOC_REGEX = /^\s*(<!doctype\s+html|<html\b|<\?xml)/i
const HTML_TAG_LIKE_REGEX = /<\s*(html|body|head|title|meta|p|div|span|h[1-6]|table|script|style)\b/i

const isLikelyMarkupBody = (value: string): boolean => {
    if (HTML_DOC_REGEX.test(value)) {
        return true
    }
    if (!value.includes('<') || !value.includes('>')) {
        return false
    }
    return HTML_TAG_LIKE_REGEX.test(value)
}

const decodeHtmlEntities = (value: string): string => {
    return value
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, '\'')
        .replace(/&apos;/g, '\'')
}

const stripMarkup = (value: string): string => {
    const titleMatch = value.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const title = titleMatch ? decodeHtmlEntities(titleMatch[1]).replace(/\s+/g, ' ').trim() : ''

    const withoutNoise = value
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<head[\s\S]*?<\/head>/gi, ' ')
    const textOnly = decodeHtmlEntities(withoutNoise.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

    if (textOnly.length > 0 && title.length > 0 && !textOnly.startsWith(title)) {
        return `${title} — ${textOnly}`
    }
    return textOnly.length > 0 ? textOnly : title
}

const readString = (record: Record<string, unknown>, key: string): string | undefined => {
    const value = record[key]
    return isString(value) ? value : undefined
}

const collectMessage = (value: unknown): string | undefined => {
    if (isNil(value)) {
        return undefined
    }
    if (isString(value)) {
        const trimmed = value.trim()
        if (trimmed.length === 0) {
            return undefined
        }
        if (isLikelyMarkupBody(trimmed)) {
            const stripped = stripMarkup(trimmed)
            return stripped.length > 0 ? stripped : undefined
        }
        return trimmed
    }
    if (Array.isArray(value)) {
        const parts = value
            .map((entry) => collectMessage(entry))
            .filter((entry): entry is string => isString(entry) && entry.length > 0)
        return parts.length > 0 ? parts.join('; ') : undefined
    }
    if (isObjectRecord(value)) {
        const nested = value['message'] ?? value['detail'] ?? value['description'] ?? value['reason'] ?? value['error']
        return collectMessage(nested)
    }
    return undefined
}

const extractApiMessage = (responseBody: unknown): string | undefined => {
    if (isNil(responseBody)) {
        return undefined
    }
    if (isString(responseBody)) {
        const collected = collectMessage(responseBody)
        return collected ? truncate(collected) : undefined
    }
    if (!isObjectRecord(responseBody)) {
        return truncate(String(responseBody))
    }
    const candidates: unknown[] = [
        responseBody['message'],
        responseBody['error_description'],
        responseBody['errorDescription'],
        responseBody['detail'],
        responseBody['title'],
        responseBody['error_message'],
        responseBody['errorMessage'],
        responseBody['errorMessages'],
        responseBody['errors'],
        responseBody['error'],
        responseBody['faultstring'],
        responseBody['fault'],
        responseBody['reason'],
        responseBody['description'],
    ]
    for (const candidate of candidates) {
        const collected = collectMessage(candidate)
        if (collected) {
            return truncate(collected)
        }
    }
    return undefined
}

const extractHttpDetails = (error: Record<string, unknown>): HttpDetails | null => {
    const response = error['response']
    if (!isObjectRecord(response)) {
        return null
    }
    const statusValue = response['status']
    const status = typeof statusValue === 'number' ? statusValue : undefined
    const responseBody = response['body']
    const headersValue = response['headers']
    const headers = isObjectRecord(headersValue) ? headersValue : undefined

    const requestRaw = error['request']
    const request = isObjectRecord(requestRaw) ? requestRaw : undefined
    const requestBody = request?.['body']
    const requestUrl = request === undefined ? undefined : readString(request, 'url')
    const requestMethod = request === undefined ? undefined : readString(request, 'method')

    if (isNil(status) && isNil(responseBody) && isNil(requestBody)) {
        return null
    }

    return {
        status,
        responseBody,
        responseHeaders: headers,
        requestBody,
        requestUrl,
        requestMethod,
        apiMessage: extractApiMessage(responseBody),
    }
}

const readErrorName = (error: Record<string, unknown>): string | undefined => {
    const name = readString(error, 'name')
    if (!isNil(name) && name.length > 0 && name !== 'Error') {
        return name
    }
    const ctor = error['constructor']
    if (typeof ctor === 'function' && isString(ctor.name) && ctor.name.length > 0 && ctor.name !== 'Object' && ctor.name !== 'Error') {
        return ctor.name
    }
    return undefined
}

const readErrorMessage = (error: Record<string, unknown>): string => {
    const messageString = readString(error, 'message')
    if (!isNil(messageString)) {
        return messageString
    }
    const stringified = String(error)
    if (stringified.length > 0 && stringified !== '[object Object]') {
        return stringified
    }
    return 'Unknown error'
}

const pickPlainMessage = ({ httpDetails, rawMessage }: { httpDetails: HttpDetails | null, rawMessage: string }): string => {
    if (httpDetails?.apiMessage) {
        return httpDetails.apiMessage
    }
    const cleaned = stripStack(rawMessage)
    if (cleaned.length > 0) {
        return truncate(cleaned)
    }
    return 'Unknown error'
}

const isFriendlyPieceError = (value: unknown): value is FriendlyPieceError => {
    if (!isObjectRecord(value)) {
        return false
    }
    return value['__apErrorVersion'] === FRIENDLY_PIECE_ERROR_VERSION && typeof value['message'] === 'string'
}

export const formatPieceError = (error: unknown): FriendlyPieceError => {
    if (isNil(error)) {
        return {
            __apErrorVersion: FRIENDLY_PIECE_ERROR_VERSION,
            message: 'Unknown error',
        }
    }

    if (isString(error)) {
        const cleaned = stripStack(error)
        return {
            __apErrorVersion: FRIENDLY_PIECE_ERROR_VERSION,
            message: cleaned.length > 0 ? cleaned : 'Unknown error',
        }
    }

    if (!isObjectRecord(error)) {
        return {
            __apErrorVersion: FRIENDLY_PIECE_ERROR_VERSION,
            message: truncate(String(error)),
        }
    }

    if (isFriendlyPieceError(error)) {
        return error
    }

    const httpDetails = extractHttpDetails(error)
    const errorName = readErrorName(error)
    const rawMessage = readErrorMessage(error)
    const message = pickPlainMessage({ httpDetails, rawMessage })

    return {
        __apErrorVersion: FRIENDLY_PIECE_ERROR_VERSION,
        message,
        errorName,
        ...(httpDetails ?? {}),
    }
}

export const tryParseFriendlyPieceError = (value: unknown): FriendlyPieceError | null => {
    if (isNil(value)) {
        return null
    }
    const candidate = isString(value) ? safeJsonParse(value) : value
    return isFriendlyPieceError(candidate) ? candidate : null
}

type HttpDetails = {
    status?: number
    responseBody?: unknown
    responseHeaders?: Record<string, unknown>
    requestBody?: unknown
    requestUrl?: string
    requestMethod?: string
    apiMessage?: string
}

export type FriendlyPieceError = {
    __apErrorVersion: 1
    message: string
    errorName?: string
    status?: number
    responseBody?: unknown
    responseHeaders?: Record<string, unknown>
    requestBody?: unknown
    requestUrl?: string
    requestMethod?: string
    apiMessage?: string
}
