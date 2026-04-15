import { FilesService } from '@activepieces/pieces-framework'
import { FileLocation, FileSizeError, FileStoreError, isNil, StepFileUpsertResponse } from '@activepieces/shared'
import fetchRetry from 'fetch-retry'

const RETRY_CONFIG = {
    retries: 3,
    retryDelay: 3000,
} as const

export function createFileUploader({ stepName, flowId, engineToken, apiUrl }: CreateFileUploaderParams): FilesService {
    const maxFileSizeMb = Number(process.env.AP_MAX_FILE_SIZE_MB)
    const fileStorageLocation = process.env.AP_FILE_STORAGE_LOCATION as FileLocation
    const useSignedUrl = (process.env.AP_S3_USE_SIGNED_URLS === 'true') && fileStorageLocation === FileLocation.S3

    return {
        write: async ({ fileName, data }: { fileName: string, data: Buffer }): Promise<string> => {
            if (!Buffer.isBuffer(data)) {
                throw new Error(
                    `Expected file data to be a Buffer, but received ${typeof data === 'object' ? Object.prototype.toString.call(data) : typeof data}`,
                )
            }
            validateFileSize(data, maxFileSizeMb)
            const formData = createFormData({ fileName, data, stepName, flowId, useSignedUrl })
            const result = await uploadFileMetadata({ formData, engineToken, apiUrl })
            if (useSignedUrl) {
                if (isNil(result.uploadUrl)) {
                    throw new FileStoreError({
                        status: 500,
                        body: 'Upload URL is not available',
                    })
                }
                await uploadFileContent({ url: result.uploadUrl, data })
            }

            return result.url
        },
    }
}

function validateFileSize(data: Buffer, maxFileSizeMb: number): void {
    const maximumFileSizeInBytes = maxFileSizeMb * 1024 * 1024
    if (data.length > maximumFileSizeInBytes) {
        throw new FileSizeError(data.length / 1024 / 1024, maxFileSizeMb)
    }
}

function createFormData({ fileName, data, stepName, flowId, useSignedUrl }: { fileName: string, data: Buffer, stepName: string, flowId: string, useSignedUrl: boolean }): FormData {
    const formData = new FormData()
    formData.append('stepName', stepName)
    formData.append('flowId', flowId)
    formData.append('contentLength', data.length.toString())
    formData.append('fileName', fileName)

    if (!useSignedUrl) {
        formData.append('file', new Blob([data], { type: 'application/octet-stream' }), fileName)
    }

    return formData
}

async function uploadFileMetadata({ formData, engineToken, apiUrl }: { formData: FormData, engineToken: string, apiUrl: string }): Promise<StepFileUpsertResponse> {
    const fetchWithRetry = fetchRetry(global.fetch)
    const response = await fetchWithRetry(apiUrl + 'v1/step-files', {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + engineToken,
        },
        ...RETRY_CONFIG,
        body: formData,
    })

    if (!response.ok) {
        const bodyText = await response.text()
        throw new FileStoreError({
            status: response.status,
            body: bodyText,
        })
    }

    return await response.json() as StepFileUpsertResponse
}

async function uploadFileContent({ url, data }: { url: string, data: Buffer }): Promise<void> {
    const fetchWithRetry = fetchRetry(global.fetch)
    const uploadResponse = await fetchWithRetry(url, {
        method: 'PUT',
        body: data,
        headers: {
            'Content-Type': 'application/octet-stream',
        },
        ...RETRY_CONFIG,
    })

    if (!uploadResponse.ok) {
        throw new FileStoreError({
            status: uploadResponse.status,
            body: await uploadResponse.text(),
        })
    }
}

type CreateFileUploaderParams = { apiUrl: string, stepName: string, flowId: string, engineToken: string }
