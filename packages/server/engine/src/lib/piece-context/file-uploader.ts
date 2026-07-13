import { apId, multipartStream } from '@activepieces/core-utils'
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
            const parts = multipartStream.chunkIntoParts(multipartStream.toAsyncIterable(stream), multipartStream.PART_SIZE_BYTES)
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
                const buffered = await multipartStream.bufferRemaining({
                    head: [firstBuffer, second.value],
                    rest: parts,
                    maxSizeBytes: maxFileSizeMb * 1024 * 1024,
                    onOverflow: (totalBytes) => new FileSizeError(totalBytes / 1024 / 1024, maxFileSizeMb),
                })
                return uploadBuffered(fileName, buffered)
            }

            const { uploadId, maxSizeBytes } = created
            return multipartStream.runMultipartStream<string>({
                head: [firstBuffer, second.value],
                rest: parts,
                ceilingBytes: maxSizeBytes,
                onCeilingExceeded: ({ totalBytes, ceilingBytes }) => new FileSizeError(totalBytes / 1024 / 1024, ceilingBytes / 1024 / 1024),
                sink: {
                    uploadPart: async ({ partNumber, data }) => {
                        const url = await engineFileApi.getPartUrl({ engineToken, apiUrl, fileId, uploadId, partNumber })
                        const etag = await engineFileApi.uploadPart({ url, data })
                        return { etag }
                    },
                    complete: async ({ parts: uploadedParts }) => {
                        const { readUrl } = await engineFileApi.completeMultipartUpload({ engineToken, apiUrl, fileId, uploadId, parts: uploadedParts })
                        return readUrl
                    },
                    abort: async () => {
                        await engineFileApi.abortMultipartUpload({ engineToken, apiUrl, fileId, uploadId })
                    },
                },
            })
        },
    }
}

function validateFileSize(data: Buffer, maxFileSizeMb: number): void {
    const maximumFileSizeInBytes = maxFileSizeMb * 1024 * 1024
    if (data.length > maximumFileSizeInBytes) {
        throw new FileSizeError(data.length / 1024 / 1024, maxFileSizeMb)
    }
}

type CreateFileUploaderParams = {
    apiUrl: string
    engineToken: string
}
