import * as Sentry from '@sentry/node'
import { logger } from './logger'
import { system } from './system/system'
import { SystemProp } from './system/system-prop'

const sentryDsn = system.get(SystemProp.SENTRY_DSN)

export const initializeSentry = () => {
    if (sentryDsn) {
        logger.info('Initializing Sentry')
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
    }
}

export const exceptionHandler = {
    handle: (e: unknown): void => {
        logger.error(e)
        if (sentryDsn) {
            Sentry.captureException(e)
        }
    },
}



const ENRICH_ERROR_CONTEXT =
    system.getBoolean(SystemProp.ENRICH_ERROR_CONTEXT) ?? false


export const enrichErrorContext = ({
    error,
    key,
    value,
}: EnrichErrorContextParams): unknown => {
    if (!ENRICH_ERROR_CONTEXT) {
        return error
    }

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
