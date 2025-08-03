import { Level, Logger, pino, TransportTargetOptions } from 'pino'
import * as HyperDX from '@hyperdx/node-opentelemetry';

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
    });

    return pino(
        { level, mixin: HyperDX.getPinoMixinFunction },
        pino.transport({
            targets: [
                HyperDX.getPinoTransport(level, {
                    detectResources: true,
                }),
                ...targets,
            ],
        }),
    );
} 