import { Readable } from 'node:stream'
import { apId } from '@activepieces/core-utils'
import { FilesService, WriteFileRequest } from '@activepieces/pieces-framework'
import { FileSizeError, FileType } from '@activepieces/shared'
import { engineFileApi } from '../api/engine-file-api'

export function createFileUploader({ engineToken, apiUrl }: CreateFileUploaderParams): FilesService {
    const maxFileSizeMb = Number(process.env.AP_MAX_FILE_SIZE_MB)
    return {
        write: async (request): Promise<string> => {
            if (isStreamWrite(request)) {
                const { readUrl } = await engineFileApi.uploadStream({
                    engineToken,
                    apiUrl,
                    fileId: apId(),
                    type: FileType.FLOW_STEP_FILE,
                    fileName: request.fileName,
                    size: request.size,
                    data: request.data,
                })
                return readUrl
            }
            if (!Buffer.isBuffer(request.data)) {
                const data: unknown = request.data
                throw new Error(
                    `Expected file data to be a Buffer or Readable stream, but received ${typeof data === 'object' ? Object.prototype.toString.call(data) : typeof data}`,
                )
            }
            validateFileSize(request.data, maxFileSizeMb)
            const { readUrl } = await engineFileApi.upload({
                engineToken,
                apiUrl,
                fileId: apId(),
                type: FileType.FLOW_STEP_FILE,
                fileName: request.fileName,
                data: request.data,
            })
            return readUrl
        },
    }
}

function isStreamWrite(request: WriteFileRequest): request is Extract<WriteFileRequest, { data: Readable }> {
    return request.data instanceof Readable
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
