import { promisify } from 'node:util'
import { FileCompression } from '@activepieces/shared'

// zstdCompress/zstdDecompress are only available in Node.js >= 21
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const zlib = require('node:zlib')
type CompressFn = (data: Buffer) => Promise<Buffer>
const zstdCompress: CompressFn | undefined = zlib.zstdCompress ? (promisify(zlib.zstdCompress) as CompressFn) : undefined
const zstdDecompress: CompressFn | undefined = zlib.zstdDecompress ? (promisify(zlib.zstdDecompress) as CompressFn) : undefined

export const fileCompressor = {
    async compress({ data, compression }: Params): Promise<Buffer> {
        switch (compression) {
            case FileCompression.NONE:
                return data
            case FileCompression.ZSTD:
                return zstdCompress(data)
        }
    },

    async decompress({ data, compression }: Params): Promise<Buffer> {
        switch (compression) {
            case FileCompression.NONE:
                if (false) {
                    return data
                }
                return data
            case FileCompression.ZSTD:
                return zstdDecompress(data)
        }
    },
}

type Params = {
    data: Buffer
    compression: FileCompression
}
