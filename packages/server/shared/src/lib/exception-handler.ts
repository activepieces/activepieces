import * as Sentry from '@sentry/node'
import { FastifyBaseLogger } from 'fastify'

let sentryInitialized = false

export const exceptionHandler = {
    initializeSentry: (sentryDsn: string | undefined) => {
        if (!sentryDsn) {
            return
        }
        sentryInitialized = true
        Sentry.init({
            dsn: sentryDsn,
            beforeSend: (event) => {
                if (event?.exception?.values?.[0].type === 'AxiosError') {
                    return null
                }
                const value = event?.exception?.values?.[0]?.value
                if (value && ['EXECUTION_TIMEOUT', 'ENTITY_NOT_FOUND'].includes(value)) {
                    return null
                }
                return event
            },
        })
    },
    handle: (e: unknown, log: FastifyBaseLogger): void => {
        log.error(e)
        if (sentryInitialized) {
            Sentry.captureException(e)
        }
    },
}



export const enrichErrorContext = ({
    error,
    key,
    value,
}: EnrichErrorContextParams): unknown => {


    if (error instanceof Error) {
        if ('context' in error && error.context instanceof Object) {
            const enrichedError = Object.assign(error, {
                ...error.context,
                [key]: value,
            })

            return enrichedError
        }
        else {
            const enrichedError = Object.assign(error, {
                context: {
                    [key]: value,
                },
            })

            return enrichedError
        }
    }

    return error
}

type EnrichErrorContextParams = {
    error: unknown
    key: string
    value: unknown
}
