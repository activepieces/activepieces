import { apId, tryCatch } from '@activepieces/core-utils'
import { FilesService } from '@activepieces/pieces-framework'
import { FileSizeError, FileType } from '@activepieces/shared'
import { engineFileApi } from '../api/engine-file-api'

const PART_SIZE_BYTES = 8 * 1024 * 1024

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

    return {
        write: async ({ fileName, data }: { fileName: string, data: Buffer }): Promise<string> => {
            if (!Buffer.isBuffer(data)) {
                throw new Error(
                    `Expected file data to be a Buffer, but received ${typeof data === 'object' ? Object.prototype.toString.call(data) : typeof data}`,
                )
            }
            return uploadBuffered(fileName, data)
        },
        writeStream: async ({ fileName, stream }): Promise<string> => {
            const parts = chunkIntoParts(toAsyncIterable(stream), PART_SIZE_BYTES)
            const first = await parts.next()
            const firstBuffer = first.done ? Buffer.alloc(0) : first.value
            const second = await parts.next()
            if (second.done) {
                // The whole stream fits in a single part — the buffered path (and its cap) covers it.
                return uploadBuffered(fileName, firstBuffer)
            }

            const fileId = apId()
            const created = await engineFileApi.createMultipartUpload({ engineToken, apiUrl, fileId, fileName })
            if (created.mode === 'DB') {
                // Honest fallback on DB-only installs: buffer the whole stream under the existing cap.
                const buffered = await bufferRemaining({
                    head: [firstBuffer, second.value],
                    rest: parts,
                    maxSizeBytes: maxFileSizeMb * 1024 * 1024,
                    onOverflow: (totalBytes) => new FileSizeError(totalBytes / 1024 / 1024, maxFileSizeMb),
                })
                return uploadBuffered(fileName, buffered)
            }

            const { uploadId, maxSizeBytes } = created
            const uploadedParts: { partNumber: number, etag: string }[] = []
            let totalBytes = 0
            try {
                const uploadOnePart = async (data: Buffer): Promise<void> => {
                    totalBytes += data.length
                    if (totalBytes > maxSizeBytes) {
                        throw new FileSizeError(totalBytes / 1024 / 1024, maxSizeBytes / 1024 / 1024)
                    }
                    const partNumber = uploadedParts.length + 1
                    const url = await engineFileApi.getPartUrl({ engineToken, apiUrl, fileId, uploadId, partNumber })
                    const etag = await engineFileApi.uploadPart({ url, data })
                    uploadedParts.push({ partNumber, etag })
                }
                await uploadOnePart(firstBuffer)
                await uploadOnePart(second.value)
                for await (const part of parts) {
                    await uploadOnePart(part)
                }
                const { readUrl } = await engineFileApi.completeMultipartUpload({ engineToken, apiUrl, fileId, uploadId, parts: uploadedParts })
                return readUrl
            }
            catch (error) {
                await tryCatch(() => engineFileApi.abortMultipartUpload({ engineToken, apiUrl, fileId, uploadId }))
                throw error
            }
        },
    }
}

function toAsyncIterable(stream: AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>): AsyncIterable<Uint8Array> {
    if (Symbol.asyncIterator in stream) {
        return stream
    }
    return (async function* () {
        const reader = stream.getReader()
        try {
            for (;;) {
                const { done, value } = await reader.read()
                if (done) {
                    return
                }
                yield value
            }
        }
        finally {
            reader.releaseLock()
        }
    })()
}

async function* chunkIntoParts(source: AsyncIterable<Uint8Array>, partSizeBytes: number): AsyncGenerator<Buffer, void, undefined> {
    let pending: Buffer[] = []
    let pendingBytes = 0
    for await (const chunk of source) {
        pending.push(Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength))
        pendingBytes += chunk.byteLength
        while (pendingBytes >= partSizeBytes) {
            const whole = Buffer.concat(pending)
            yield whole.subarray(0, partSizeBytes)
            const rest = whole.subarray(partSizeBytes)
            pending = rest.length > 0 ? [rest] : []
            pendingBytes = rest.length
        }
    }
    if (pendingBytes > 0) {
        yield Buffer.concat(pending)
    }
}

async function bufferRemaining({ head, rest, maxSizeBytes, onOverflow }: BufferRemainingParams): Promise<Buffer> {
    const buffers = [...head]
    let totalBytes = head.reduce((sum, buffer) => sum + buffer.length, 0)
    if (totalBytes > maxSizeBytes) {
        throw onOverflow(totalBytes)
    }
    for await (const part of rest) {
        totalBytes += part.length
        if (totalBytes > maxSizeBytes) {
            throw onOverflow(totalBytes)
        }
        buffers.push(part)
    }
    return Buffer.concat(buffers)
}

function validateFileSize(data: Buffer, maxFileSizeMb: number): void {
    const maximumFileSizeInBytes = maxFileSizeMb * 1024 * 1024
    if (data.length > maximumFileSizeInBytes) {
        throw new FileSizeError(data.length / 1024 / 1024, maxFileSizeMb)
    }
}

type BufferRemainingParams = {
    head: Buffer[]
    rest: AsyncGenerator<Buffer, void, undefined>
    maxSizeBytes: number
    onOverflow: (totalBytes: number) => Error
}

type CreateFileUploaderParams = {
    apiUrl: string
    engineToken: string
}
