import { loggerRedact } from '@activepieces/server-utils'
import { Level, pino, TransportTargetOptions } from 'pino'
import 'pino-loki'
import { AppSystemProp, environmentVariables } from '../../system/system-props'
import { TransportProvider } from './transport-provider'

export const lokiTransport: TransportProvider = {
    name: 'loki',
    isConfigured() {
        return !!environmentVariables.getEnvironment(AppSystemProp.LOKI_URL)
    },
    createLogger(level: Level, targets: TransportTargetOptions[]) {
        const lokiUrl = environmentVariables.getEnvironmentOrThrow(AppSystemProp.LOKI_URL)
        const lokiUsername = environmentVariables.getEnvironment(AppSystemProp.LOKI_USERNAME)
        const lokiPassword = environmentVariables.getEnvironment(AppSystemProp.LOKI_PASSWORD)

        return pino({
            level,
            redact: loggerRedact,
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
    },
}
