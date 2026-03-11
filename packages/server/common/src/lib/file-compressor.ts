import { promisify } from 'node:util'
import { gzip as gzipCallback, unzip as unzipCallback } from 'node:zlib'
import { FileCompression } from '@activepieces/shared'

const gzip = promisify(gzipCallback)
const unzip = promisify(unzipCallback)

// zstdCompress/zstdDecompress are only available in Node.js >= 21
// eslint-disable-next-line @typescript-eslint/no-require-imports
const zlib = require('node:zlib')
type CompressFn = (data: Buffer) => Promise<Buffer>
const zstdCompress: CompressFn | undefined = zlib.zstdCompress ? (promisify(zlib.zstdCompress) as CompressFn) : undefined
const zstdDecompress: CompressFn | undefined = zlib.zstdDecompress ? (promisify(zlib.zstdDecompress) as CompressFn) : undefined

export const fileCompressor = {
    async compress({ data, compression }: Params): Promise<Buffer> {
        switch (compression) {
            case FileCompression.NONE:
                return data
            case FileCompression.GZIP:
                return gzip(data)
            case FileCompression.ZSTD:
                if (!zstdCompress) {
                    throw new Error('ZSTD compression requires Node.js >= 21')
                }
                return zstdCompress(data)
        }
    },

    async decompress({ data, compression }: Params): Promise<Buffer> {
        switch (compression) {
            case FileCompression.NONE:
                return data
            case FileCompression.GZIP:
                return unzip(data)
            case FileCompression.ZSTD:
                if (!zstdDecompress) {
                    throw new Error('ZSTD decompression requires Node.js >= 21')
                }
                return zstdDecompress(data)
        }
    },
}

type Params = {
    data: Buffer
    compression: FileCompression
}
