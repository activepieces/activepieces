import { FLOW_RUN_LOG_MANIFEST_V2 } from './execution/step-output'
import { ExecutioOutputFile } from './execution/execution-output'

export const logSerializer = {
    async serialize(log: ExecutioOutputFile): Promise<Buffer> {
        const withVersion: ExecutioOutputFile = log.version
            ? log
            : { ...log, version: FLOW_RUN_LOG_MANIFEST_V2 }
        return Buffer.from(JSON.stringify(withVersion, null))
    },
}
