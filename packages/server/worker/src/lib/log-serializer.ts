import { FileCompression, ExecutioOutputFile } from '@activepieces/shared'
import { logger, fileCompressor } from 'server-shared'

export const logSerializer = {
    async serialize(log: ExecutioOutputFile): Promise<Buffer> {
        const stringifiedLog = JSON.stringify(log, memoryFileReplacer)
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

const memoryFileReplacer = (_key: string, value: unknown): unknown => {
    if (typeof value === 'string' && value.startsWith('memory://')) {
        return '[TRUNCATED]'
    }

    return value
}
