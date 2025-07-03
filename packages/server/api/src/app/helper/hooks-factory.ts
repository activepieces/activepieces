import { isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'



export const hooksFactory = {
    create<T>(defaultHooks: (log: FastifyBaseLogger) => T) {
        let hooksCreator: (log: FastifyBaseLogger) => T
        return {
            set(newHooksCreator: (log: FastifyBaseLogger) => T): void {
                hooksCreator = newHooksCreator
            },
            get(log: FastifyBaseLogger): T {
                if (isNil(hooksCreator)) {
                    return defaultHooks(log)
                }
                return hooksCreator(log)
            },
        }
    },
}