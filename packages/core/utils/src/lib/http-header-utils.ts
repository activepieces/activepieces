export function sanitizeHttpHeaderName(name: string): string {
    const invalidHeaderNameChars = /[^!#$%&'*+\-.^_`|~0-9A-Za-z]/g
    return name.trim().replace(invalidHeaderNameChars, '')
}

export function sanitizeHttpHeaders(headers: Record<string, string> | undefined): Record<string, string> {
    if (!headers) {
        return {}
    }
    return Object.fromEntries(
        Object.entries(headers)
            .map(([key, value]) => [sanitizeHttpHeaderName(key), value])
            .filter(([key]) => key !== ''),
    )
}
