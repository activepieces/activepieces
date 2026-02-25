import { FastifyBaseLogger } from 'fastify'
import { PostHog } from 'posthog-node'

let posthogClient: PostHog | undefined

const IGNORED_ERRORS = ['AxiosError', 'EXECUTION_TIMEOUT', 'ENTITY_NOT_FOUND']

function shouldIgnoreError(e: unknown): boolean {
    if (e instanceof Error) {
        if (e.name === 'AxiosError') {
            return true
        }
        if (IGNORED_ERRORS.includes(e.message)) {
            return true
        }
    }
    return false
}

export const exceptionHandler = {
    initializePosthog: (apiKey: string | undefined) => {
        if (!apiKey) {
            return
        }
        posthogClient = new PostHog(apiKey)
    },
    handle: (e: unknown, log: FastifyBaseLogger): void => {
        log.error(e)
        if (posthogClient && !shouldIgnoreError(e)) {
            posthogClient.captureException(e, 'activepieces-server')
        }
    },
}
