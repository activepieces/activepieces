import { Readable } from 'node:stream'
import { apId } from '@activepieces/core-utils'
import { FilesService } from '@activepieces/pieces-framework'
import { EngineGenericError, FileSizeError, FileType } from '@activepieces/shared'
import { engineFileApi } from '../api/engine-file-api'

export function createFileUploader({ engineToken, apiUrl }: CreateFileUploaderParams): FilesService {
    return {
        write: async ({ fileName, data }: { fileName: string, data: Buffer | Readable }): Promise<string> => {
            if (!Buffer.isBuffer(data) && !(data instanceof Readable)) {
                throw new Error(`Expected file data to be a Buffer or Readable stream, but received ${describeType(data)}`)
            }
            const maxBytes = resolveMaxFileSizeBytes()
            const payload = Buffer.isBuffer(data) ? data : await drainToBuffer({ stream: data, maxBytes })
            assertWithinLimit({ sizeInBytes: payload.length, maxBytes })
            const { readUrl } = await engineFileApi.upload({
                engineToken,
                apiUrl,
                fileId: apId(),
                type: FileType.FLOW_STEP_FILE,
                fileName,
                data: payload,
            })
            return readUrl
        },
    }
}

async function drainToBuffer({ stream, maxBytes }: { stream: Readable, maxBytes: number }): Promise<Buffer> {
    const chunks: Buffer[] = []
    let totalBytes = 0
    for await (const chunk of stream) {
        const bytes = toBufferChunk(chunk)
        totalBytes += bytes.length
        assertWithinLimit({ sizeInBytes: totalBytes, maxBytes })
        chunks.push(bytes)
    }
    return Buffer.concat(chunks)
}

function resolveMaxFileSizeBytes(): number {
    const raw = process.env.AP_MAX_FILE_SIZE_MB
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new EngineGenericError(
            'FileUploaderMisconfiguredError',
            `AP_MAX_FILE_SIZE_MB must be a positive number, received "${raw ?? ''}"`,
        )
    }
    return parsed * BYTES_PER_MB
}

function assertWithinLimit({ sizeInBytes, maxBytes }: { sizeInBytes: number, maxBytes: number }): void {
    if (sizeInBytes > maxBytes) {
        throw new FileSizeError(Math.ceil(sizeInBytes / BYTES_PER_MB * 100) / 100, maxBytes / BYTES_PER_MB)
    }
}

function toBufferChunk(chunk: unknown): Buffer {
    if (Buffer.isBuffer(chunk)) {
        return chunk
    }
    if (typeof chunk === 'string') {
        return Buffer.from(chunk)
    }
    throw new Error(`Expected file stream to emit Buffer or string chunks, but received ${describeType(chunk)}`)
}

function describeType(value: unknown): string {
    return typeof value === 'object' ? Object.prototype.toString.call(value) : typeof value
}

const BYTES_PER_MB = 1024 * 1024

type CreateFileUploaderParams = {
    apiUrl: string
    engineToken: string
}
