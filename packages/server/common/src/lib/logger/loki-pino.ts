import { Level, Logger, pino, TransportTargetOptions } from 'pino'
import 'pino-loki'

export type LokiCredentials = {        
    url: string | undefined
    username: string | undefined
    password: string | undefined
}

export const createLokiTransport = (level: Level, targets: TransportTargetOptions[], loki: LokiCredentials): Logger | null => {
    const lokiUrl = loki.url
    const lokiUsername = loki.username
    const lokiPassword = loki.password
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