import pino from 'pino'
import * as Sentry from '@sentry/node'
import { system } from './system/system'
import { SystemProp } from './system/system-prop'
import { ApEnvironment } from '@activepieces/shared'

const sentryDsn = system.get(SystemProp.SENTRY_DSN)

export const initilizeSentry = () => {
    if (sentryDsn) {
        logger.info('Initializing Sentry')
        Sentry.init({
            dsn: sentryDsn,
            tracesSampleRate: 1.0,
        })
    }
}

export const captureException = (error: Error) => {
    logger.error(error)
    if (sentryDsn) {
        Sentry.captureException(error)
    }
}

const initLogger = () => {
    const env = system.getOrThrow(SystemProp.ENVIRONMENT)

    const level: pino.Level = env === ApEnvironment.DEVELOPMENT
        ? 'debug'
        : 'info'

    return pino({
        level,
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                colorize: true,
                ignore: 'pid,hostname',
            },
        },
    })
}

export const logger = initLogger()
