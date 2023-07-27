import pino from 'pino'
import { system } from './system/system'
import { SystemProp } from './system/system-prop'
import { ApEnvironment } from '@activepieces/shared'

export const captureException = (error: unknown) => {
    logger.error(error)
}

const initLogger = () => {
    const env = system.get(SystemProp.ENVIRONMENT)

    const level: pino.Level = env === ApEnvironment.DEVELOPMENT
        ? 'debug'
        : 'info'

    return pino({
        level,
        transport: env === ApEnvironment.PRODUCTION ? undefined : { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss Z', colorize: true, ignore: 'pid,hostname' } },
    })
}

export const logger = initLogger()
