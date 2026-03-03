import * as HyperDX from '@hyperdx/node-opentelemetry'
import { Level, Logger, pino, transport, TransportTargetOptions } from 'pino'

export type HyperDXCredentials = {
    token: string | undefined
}

export const createHyperDXTransport = (level: Level, targets: TransportTargetOptions[], hyperdx?: HyperDXCredentials): Logger | null => {
    if (!hyperdx) {
        return null
    }
    const token = hyperdx.token
    if (!token) {
        return null
    }
    HyperDX.init({
        apiKey: token,
        service: 'activepieces',
    })

    return pino(
        { level, mixin: HyperDX.getPinoMixinFunction },
        transport({
            targets: [
                HyperDX.getPinoTransport(level, {
                    detectResources: true,
                    queueSize: 1000,
                }),
                ...targets,
            ],
        }),
    )
} 