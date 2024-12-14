import { Level, Logger, pino, TransportTargetOptions } from 'pino'
import 'pino-loki'
import { system } from '../system/system'
import { SharedSystemProp } from '../system/system-prop'

export const createLokiTransport = (level: Level, targets: TransportTargetOptions[]): Logger | null => {
    const lokiUrl = system.get(SharedSystemProp.LOKI_URL)
    const lokiUsername = system.get(SharedSystemProp.LOKI_USERNAME)
    const lokiPassword = system.get(SharedSystemProp.LOKI_PASSWORD)

    if (!lokiUrl) {
        return null
    }

    return pino({
        level,
        transport: {
            targets: [
                {
                    target: 'pino-loki',
                    level,
                    options: {
                        batching: true,
                        interval: 5,
                        host: lokiUrl,
                        basicAuth:
                            lokiUsername && lokiPassword
                                ? {
                                    username: lokiUsername,
                                    password: lokiPassword,
                                }
                                : undefined,
                    },
                },
                ...targets,
            ],
        },
    })
} 