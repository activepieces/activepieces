import pino from 'pino'
import { system, WorkerSystemProp } from './configs'

export const logger = pino({
    level: system.get(WorkerSystemProp.LOG_LEVEL) ?? 'info',
    transport: system.get(WorkerSystemProp.LOG_PRETTY) === 'true' ? {
        target: 'pino-pretty',
        options: {
            translateTime: 'HH:MM:ss Z',
            colorize: true,
            ignore: 'pid,hostname',
        },
    } : undefined,
})
