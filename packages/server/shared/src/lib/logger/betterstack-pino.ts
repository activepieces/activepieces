import pino, { Level, Logger, TransportTargetOptions } from 'pino'

export type BetterStackCredentials = {
    sourceToken: string | undefined
    host: string | undefined
}

export const createBetterStackTransport = (
    level: Level, targets: TransportTargetOptions[], betterstack?: BetterStackCredentials,
): Logger | null => {
    if (!betterstack) {
        return null
    }
    const token = betterstack.sourceToken

    if (!token) {
        return null
    }

    const host = betterstack.host

    if (!host) {
        return null
    }

    return pino({
        level,
        transport: {
            targets: [{
                target: '@logtail/pino',
                options: {
                    sourceToken: betterstack.sourceToken,
                    options: { endpoint: `https://${host}` },
                },
                ...targets,
            }]
            ,
        },
    })
}

