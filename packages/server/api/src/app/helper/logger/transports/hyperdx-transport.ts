import * as HyperDX from '@hyperdx/node-opentelemetry'
import { Level, pino, transport, TransportTargetOptions } from 'pino'
import { AppSystemProp, environmentVariables } from '../../system/system-props'
import { TransportProvider } from './transport-provider'

export const hyperdxTransport: TransportProvider = {
    name: 'hyperdx',
    isConfigured() {
        return !!environmentVariables.getEnvironment(AppSystemProp.HYPERDX_TOKEN)
    },
    createLogger(level: Level, targets: TransportTargetOptions[]) {
        const token = environmentVariables.getEnvironmentOrThrow(AppSystemProp.HYPERDX_TOKEN)
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
    },
}
