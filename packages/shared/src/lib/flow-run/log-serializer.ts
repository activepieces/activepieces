import { ExecutioOutputFile } from '@activepieces/shared'

export const logSerializer = {
    async serialize(log: ExecutioOutputFile): Promise<Buffer> {
        return Buffer.from(JSON.stringify(log, null))
    },
}
