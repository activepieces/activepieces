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

