import { fileCompressor, logger } from '@activepieces/server-shared'
import { ExecutioOutputFile, FileCompression } from '@activepieces/shared'

export const logSerializer = {
    async serialize(log: ExecutioOutputFile): Promise<Buffer> {
        const stringifiedLog = JSON.stringify(log, null)
        const binaryLog = Buffer.from(stringifiedLog)

        const compressedLog = await fileCompressor.compress({
            data: binaryLog,
            compression: FileCompression.GZIP,
        })

        logger.debug(
            {
                'binaryLog.byteLength': binaryLog.byteLength,
                'compressedLog.byteLength': compressedLog.byteLength,
            },
            '[logSerializer#serialize]',
        )

        return compressedLog
    },
}
