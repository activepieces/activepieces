import pino from 'pino'
import { system, WorkerSystemProp } from './configs'

export const logger = pino({
    level: system.get(WorkerSystemProp.LOG_LEVEL),
    transport: system.getBoolean(WorkerSystemProp.LOG_PRETTY) ? {
        target: 'pino-pretty',
        options: {
            translateTime: 'HH:MM:ss Z',
            colorize: true,
            ignore: 'pid,hostname',
        },
    } : undefined,
})
