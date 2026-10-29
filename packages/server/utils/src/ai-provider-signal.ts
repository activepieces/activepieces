import { isNil, ProviderOutcomeSignal, toProviderOutcomeSignal } from '@activepieces/core-utils'
import { APICallError, RetryError } from 'ai'

function fromError(error: unknown): ProviderOutcomeSignal {
    const root = innermostError(error)
    if (APICallError.isInstance(root)) {
        return {
            ...(isNil(root.statusCode) ? {} : { statusCode: root.statusCode }),
            ...(isNil(root.responseBody) ? {} : { body: root.responseBody }),
            message: root.message,
            retryable: root.isRetryable,
            fromProvider: true,
        }
    }
    return { ...toProviderOutcomeSignal(root), fromProvider: false }
}

function innermostError(error: unknown): unknown {
    let current = error
    for (let depth = 0; depth < MAX_CAUSE_DEPTH; depth++) {
        if (RetryError.isInstance(current) && !isNil(current.lastError)) {
            current = current.lastError
            continue
        }
        if (APICallError.isInstance(current)) {
            return current
        }
        const cause = current instanceof Error ? current.cause : undefined
        if (isNil(cause)) {
            return current
        }
        current = cause
    }
    return current
}

const MAX_CAUSE_DEPTH = 5

export const aiProviderSignal = {
    fromError,
}
