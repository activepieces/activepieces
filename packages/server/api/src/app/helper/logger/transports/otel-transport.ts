
import { Level, pino, transport, TransportTargetOptions } from 'pino'
import { AppSystemProp, environmentVariables } from '../../system/system-props'
import { TransportProvider } from './transport-provider'

export const otelTransport: TransportProvider = {
    name: 'otel',
    isConfigured() {
        return !!environmentVariables.getEnvironment(AppSystemProp.OTEL_ENABLED)
    },
    createLogger(level: Level, targets: TransportTargetOptions[]) {
        return pino(
            { level },
            transport({ 
                targets: [
                    {
                        target: 'pino-opentelemetry-transport',
                    },
                    ...targets,
                ],
            }),
        )
    },
}
