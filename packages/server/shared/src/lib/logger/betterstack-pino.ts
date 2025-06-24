import { Level, Logger, pino, TransportTargetOptions } from 'pino'

export type BetterStackParams = {
    token?: string
    endpoint?: string
}

export const createLogTailTransport = (level: Level, targets: TransportTargetOptions[], params: BetterStackParams): Logger | null => {
    const sourceToken = params.token
    const endpoint = params.endpoint

    if (!endpoint) {
        return null
    }

    return pino({
        level,
        transport: {
            targets: [
                {
                    level,
                    target: '@logtail/pino',
                    options: {
                        sourceToken,
                        options: { endpoint },
                    },
                },
                ...targets,
            ],
        },
    })
}
