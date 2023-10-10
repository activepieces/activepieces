import * as Sentry from '@sentry/node'
import { system } from '../../helper/system/system'
import { logger } from '../../helper/logger'
import { SystemProp } from '../../helper/system/system-prop'

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