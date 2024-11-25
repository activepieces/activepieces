import { FilesService } from '@activepieces/pieces-framework'
import { FileLocation, isNil, StepFileUpsertResponse } from '@activepieces/shared'
import fetchRetry from 'fetch-retry'
import { FileSizeError, FileStoreError } from '../helper/execution-errors'

const MAX_FILE_SIZE_MB = Number(process.env.AP_MAX_FILE_SIZE_MB)
const FILE_STORAGE_LOCATION = process.env.AP_FILE_STORAGE_LOCATION as FileLocation
const USE_SIGNED_URL = (process.env.AP_S3_USE_SIGNED_URLS === 'true') && FILE_STORAGE_LOCATION === FileLocation.S3

export type DefaultFileSystem = 'db' | 'local'

type CreateFilesServiceParams = { apiUrl: string, stepName: string, flowId: string, engineToken: string }

export function createFilesService({ stepName, flowId, engineToken, apiUrl }: CreateFilesServiceParams): FilesService {
    return {
        write: async ({ fileName, data }: { fileName: string, data: Buffer }): Promise<string> => {
            validateFileSize(data)
            const formData = createFormData({ fileName, data, stepName, flowId })
            const result = await uploadFileMetadata({ formData, engineToken, apiUrl })
            if (USE_SIGNED_URL) {
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

function validateFileSize(data: Buffer): void {
    const maximumFileSizeInBytes = MAX_FILE_SIZE_MB * 1024 * 1024
    if (data.length > maximumFileSizeInBytes) {
        throw new FileSizeError(data.length / 1024 / 1024, MAX_FILE_SIZE_MB)
    }
}

function createFormData({ fileName, data, stepName, flowId }: { fileName: string, data: Buffer, stepName: string, flowId: string }): FormData {
    const formData = new FormData()
    formData.append('stepName', stepName)
    formData.append('flowId', flowId)
    formData.append('contentLength', data.length.toString())
    formData.append('fileName', fileName)

    if (!USE_SIGNED_URL) {
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
        retryDelay: 3000,
        retries: 3,
        body: formData,
    })

    if (!response.ok) {
        throw new FileStoreError({
            status: response.status,
            body: response.body,
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
        retries: 3,
        retryDelay: 3000,
    })

    if (!uploadResponse.ok) {
        throw new FileStoreError({
            status: uploadResponse.status,
            body: uploadResponse.body,
        })
    }
}
