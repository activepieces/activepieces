import { Level, Logger, TransportTargetOptions } from 'pino'

export type TransportProvider = {
    name: string
    isConfigured: () => boolean
    createLogger: (level: Level, defaultTargets: TransportTargetOptions[]) => Logger
}

export function resolveTransport(providers: TransportProvider[], level: Level, defaultTargets: TransportTargetOptions[]): Logger | null {
    for (const provider of providers) {
        if (provider.isConfigured()) {
            return provider.createLogger(level, defaultTargets)
        }
    }
    return null
}
