import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'

export function assertSafePathSegment(value: string, field: string): void {
    const isUnsafe = value.length === 0
        || value === '.'
        || value === '..'
        || value.includes('..')
        || value.includes('/')
        || value.includes('\\')
        || value.includes('\0')
    if (isUnsafe) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: `Invalid ${field}: "${value}" is not a safe path segment` },
        })
    }
}

export function assertSafeCodeNamespace(namespace: string): void {
    const segments = namespace.split('/')
    if (segments.length > MAX_CODE_NAMESPACE_DEPTH) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: `Invalid code namespace: "${namespace}" exceeds ${MAX_CODE_NAMESPACE_DEPTH} segments` },
        })
    }
    for (const segment of segments) {
        assertSafePathSegment(segment, 'code namespace segment')
    }
}

const MAX_CODE_NAMESPACE_DEPTH = 2
