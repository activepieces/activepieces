import { promisify } from 'node:util'
import { gzip as gzipCallback, unzip as unzipCallback } from 'node:zlib'
import { FileCompression } from '@activepieces/shared'

const gzip = promisify(gzipCallback)
const unzip = promisify(unzipCallback)

export const fileCompressor = {
    async compress({ data, compression }: Params): Promise<Buffer> {
        switch (compression) {
            case FileCompression.NONE:
                return data
            case FileCompression.GZIP:
                return gzip(data)
        }
    },

    async decompress({ data, compression }: Params): Promise<Buffer> {
        switch (compression) {
            case FileCompression.NONE:
                return data
            case FileCompression.GZIP:
                return unzip(data)
        }
    },
}

type Params = {
    data: Buffer
    compression: FileCompression
}
