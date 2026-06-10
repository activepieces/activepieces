import { loggerRedact } from '@activepieces/server-utils'
import { Level, pino, TransportTargetOptions } from 'pino'
import { AppSystemProp, environmentVariables } from '../../system/system-props'
import { TransportProvider } from './transport-provider'

export const betterstackTransport: TransportProvider = {
    name: 'betterstack',
    isConfigured() {
        return !!environmentVariables.getEnvironment(AppSystemProp.BETTERSTACK_TOKEN)
            && !!environmentVariables.getEnvironment(AppSystemProp.BETTERSTACK_HOST)
    },
    createLogger(level: Level, targets: TransportTargetOptions[]) {
        const token = environmentVariables.getEnvironmentOrThrow(AppSystemProp.BETTERSTACK_TOKEN)
        const host = environmentVariables.getEnvironmentOrThrow(AppSystemProp.BETTERSTACK_HOST)

        return pino({
            level,
            redact: loggerRedact,
            transport: {
                targets: [
                    {
                        target: '@logtail/pino',
                        level,
                        options: {
                            sourceToken: token,
                            options: {
                                endpoint: host,
                            },
                        },
                    },
                    ...targets,
                ],
            },
        })
    },
}
