import { isNil } from "@activepieces/shared"
import { SystemJobHandler, SystemJobName } from "./common"

const jobHandlers = new Map<SystemJobName, SystemJobHandler>()

const registerJobHandler = (name: SystemJobName, handler: SystemJobHandler): void => {
    jobHandlers.set(name, handler)
}

const getJobHandler = (name: SystemJobName): SystemJobHandler => {
    const jobHandler = jobHandlers.get(name)

    if (isNil(jobHandler)) {
        throw new Error(`No handler for job ${name}`)
    }
    
    return jobHandler
}

export { jobHandlers, registerJobHandler, getJobHandler}