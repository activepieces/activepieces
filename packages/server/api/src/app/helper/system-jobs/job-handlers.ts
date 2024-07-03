import { isNil } from '@activepieces/shared'
import { SystemJobHandler, SystemJobName } from './common'

const jobHandlers = new Map<SystemJobName, SystemJobHandler>()

export const systemJobHandlers = {
    registerJobHandler(name: SystemJobName, handler: SystemJobHandler): void {
        jobHandlers.set(name, handler)
    },
    getJobHandler(name: SystemJobName): SystemJobHandler {
        const jobHandler = jobHandlers.get(name)
    
        if (isNil(jobHandler)) {
            throw new Error(`No handler for job ${name}`)
        }
        
        return jobHandler
    },
}