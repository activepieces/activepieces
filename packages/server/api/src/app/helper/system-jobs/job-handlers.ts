import { isNil } from '@activepieces/shared'
import { SystemJobHandler, SystemJobName } from './common'

const jobHandlers = new Map<SystemJobName, SystemJobHandler>()

export const systemJobHandlers = {
    registerJobHandler<T extends SystemJobName>(name: T, handler: SystemJobHandler<T>): void {
        jobHandlers.set(name, handler as SystemJobHandler)
    },
    getJobHandler(name: SystemJobName): SystemJobHandler {
        const jobHandler = jobHandlers.get(name)
    
        if (isNil(jobHandler)) {
            throw new Error(`No handler for job ${name}`)
        }
        
        return jobHandler
    },
}