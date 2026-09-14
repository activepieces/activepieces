import { isNil, tryParseFriendlyPieceError } from '@activepieces/core-utils'

export function summarizeEngineError({ error }: { error: string | undefined }): string | undefined {
    if (isNil(error)) {
        return undefined
    }
    const parsed = tryParseFriendlyPieceError(error)
    if (!isNil(parsed)) {
        return [parsed.errorName, parsed.message].filter((part) => !isNil(part)).join(': ')
    }
    return error.slice(0, MAX_ERROR_SUMMARY_LENGTH)
}

const MAX_ERROR_SUMMARY_LENGTH = 500
