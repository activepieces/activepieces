import { tryCatchSync } from './try-catch'
import { isNil } from './utils'

export function sanitizeHttpHeaderName(name: string): string {
    const invalidHeaderNameChars = /[^!#$%&'*+\-.^_`|~0-9A-Za-z]/g
    return name.trim().replace(invalidHeaderNameChars, '')
}

export function sanitizeHttpHeaderValue({ name, value }: { name: string, value: string }): string {
    const withoutControlCharacters = Array.from(String(value)).filter((character) => !isControlCharacter(character)).join('').trim()
    if (name.toLowerCase() === 'location') {
        return Array.from(withoutControlCharacters).map((character) => percentEncodeIfNotUrlSafe(character)).join('')
    }
    return Array.from(withoutControlCharacters).filter((character) => isValidHeaderValueCharacter(character)).join('')
}

export function sanitizeHttpHeaders(headers: Record<string, string> | undefined): Record<string, string> {
    if (!headers) {
        return {}
    }
    return Object.fromEntries(
        Object.entries(headers)
            .filter(([, value]) => !isNil(value))
            .map(([key, value]) => {
                const name = sanitizeHttpHeaderName(key)
                return [name, sanitizeHttpHeaderValue({ name, value })]
            })
            .filter(([key]) => key !== ''),
    )
}

export function toSendableHttpBody({ body, headers }: { body: unknown, headers: Record<string, string> }): unknown {
    if (isNil(body) || typeof body === 'string' || body instanceof Uint8Array) {
        return body
    }
    const contentType = Object.entries(headers).find(([key]) => key.toLowerCase() === 'content-type')?.[1]
    if (isNil(contentType) || contentType.toLowerCase().includes('json')) {
        return body
    }
    return typeof body === 'object' ? JSON.stringify(body) : String(body)
}

function isControlCharacter(character: string): boolean {
    const code = character.codePointAt(0) ?? 0
    return character !== '\t' && (code < 0x20 || code === 0x7f)
}

function isValidHeaderValueCharacter(character: string): boolean {
    const code = character.codePointAt(0) ?? 0
    return character === '\t' || (code >= 0x20 && code <= 0x7e) || (code >= 0x80 && code <= 0xff)
}

function percentEncodeIfNotUrlSafe(character: string): string {
    const code = character.codePointAt(0) ?? 0
    if (code >= 0x21 && code <= 0x7e) {
        return character
    }
    const { data } = tryCatchSync(() => encodeURIComponent(character))
    return data ?? ''
}
