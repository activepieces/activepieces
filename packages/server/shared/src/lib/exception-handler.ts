import * as Sentry from '@sentry/node'
import { logger } from './logger'
import { SystemProp } from './system/system-prop'
import { system } from './system/system'

const sentryDsn = system.get(SystemProp.SENTRY_DSN)

export const initilizeSentry = () => {
    if (sentryDsn) {
        logger.info('Initializing Sentry')
        Sentry.init({
            dsn: sentryDsn,
            tracesSampleRate: 0.2,
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
