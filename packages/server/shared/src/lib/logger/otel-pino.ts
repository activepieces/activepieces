import { Level, Logger, pino, TransportTargetOptions } from 'pino'
import 'pino-opentelemetry-transport'

export const createOtelTransport = (level: Level, targets: TransportTargetOptions[]): Logger | null => {
    return pino({
        level,
        transport: {
            targets: [
                {
                    target: 'pino-opentelemetry-transport',
                    level,
                    options: {
                    },
                },
                ...targets,
            ],
        },
    })
}
