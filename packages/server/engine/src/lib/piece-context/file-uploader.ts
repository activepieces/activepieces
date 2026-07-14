import { Readable } from 'node:stream'
import { apId, isNil, multipartStream } from '@activepieces/core-utils'
import { FilesService } from '@activepieces/pieces-framework'
import { FileSizeError, FileType } from '@activepieces/shared'
import { engineFileApi } from '../api/engine-file-api'

export function createFileUploader({ engineToken, apiUrl }: CreateFileUploaderParams): FilesService {
    const maxFileSizeMb = Number(process.env.AP_MAX_FILE_SIZE_MB)

    const uploadBuffered = async (fileName: string, data: Buffer): Promise<string> => {
        validateFileSize(data, maxFileSizeMb)
        const { readUrl } = await engineFileApi.upload({
            engineToken,
            apiUrl,
            fileId: apId(),
            type: FileType.FLOW_STEP_FILE,
            fileName,
            data,
        })
        return readUrl
    }

    const writeStream = async ({ fileName, stream, size }: WriteStreamParams): Promise<string> => {
        const fileId = apId()
        const created = await engineFileApi.createUpload({ engineToken, apiUrl, fileId, type: FileType.FLOW_STEP_FILE, fileName, size })
        if (created.mode === 'DB') {
            // Honest fallback on DB-only installs: buffer the whole stream under the existing cap.
            const buffered = await multipartStream.bufferRemaining({
                head: [],
                rest: multipartStream.toAsyncIterable(stream),
                maxSizeBytes: maxFileSizeMb * 1024 * 1024,
                onOverflow: (totalBytes) => new FileSizeError(totalBytes / 1024 / 1024, maxFileSizeMb),
            })
            return uploadBuffered(fileName, buffered)
        }
        await engineFileApi.putStream({
            url: created.url,
            stream: Readable.from(multipartStream.toAsyncIterable(stream)),
            size,
        })
        return created.readUrl
    }

    return {
        write: async ({ fileName, data, size }): Promise<string> => {
            if (Buffer.isBuffer(data)) {
                return uploadBuffered(fileName, data)
            }
            if (isStream(data)) {
                if (isNil(size)) {
                    throw new Error('Streaming file writes require a numeric `size` (in bytes). Pass `size`, or pass a Buffer to buffer the file in memory instead.')
                }
                return writeStream({ fileName, stream: data, size })
            }
            throw new Error(
                `Expected file data to be a Buffer or stream, but received ${typeof data === 'object' ? Object.prototype.toString.call(data) : typeof data}`,
            )
        },
    }
}

function validateFileSize(data: Buffer, maxFileSizeMb: number): void {
    const maximumFileSizeInBytes = maxFileSizeMb * 1024 * 1024
    if (data.length > maximumFileSizeInBytes) {
        throw new FileSizeError(data.length / 1024 / 1024, maxFileSizeMb)
    }
}

function isStream(value: unknown): value is AsyncIterable<Uint8Array> | ReadableStream<Uint8Array> {
    return typeof value === 'object' && value !== null
        && (Symbol.asyncIterator in value || typeof (value as ReadableStream).getReader === 'function')
}

type CreateFileUploaderParams = {
    apiUrl: string
    engineToken: string
}

type WriteStreamParams = {
    fileName: string
    stream: AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>
    size: number
}
