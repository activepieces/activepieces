import * as Sentry from '@sentry/node'
import { system } from './system/system'
import { logger } from './logger'
import { SystemProp } from './system/system-prop'

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
    handle: async (e: unknown) => {
        if (sentryDsn) {
            Sentry.captureException(e)
        }
    },
}