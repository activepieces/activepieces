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
