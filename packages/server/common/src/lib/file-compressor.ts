import { promisify } from 'node:util'
import { gzip as gzipCallback, unzip as unzipCallback, zstdCompress as zstdCompressCallback, zstdDecompress as zstdDecompressCallback } from 'node:zlib'
import { FileCompression } from '@activepieces/shared'

const gzip = promisify(gzipCallback)
const unzip = promisify(unzipCallback)
const zstdCompress = promisify(zstdCompressCallback)
const zstdDecompress = promisify(zstdDecompressCallback)

export const fileCompressor = {
    async compress({ data, compression }: Params): Promise<Buffer> {
        switch (compression) {
            case FileCompression.NONE:
                return data
            case FileCompression.GZIP:
                return gzip(data)
            case FileCompression.ZSTD:
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
                return zstdDecompress(data)
        }
    },
}

type Params = {
    data: Buffer
    compression: FileCompression
}
