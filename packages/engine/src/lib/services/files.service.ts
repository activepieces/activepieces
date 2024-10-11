import { FilesService } from '@activepieces/pieces-framework'
import fetchRetry from 'fetch-retry'
import { FileSizeError, FileStoreError } from '../helper/execution-errors'

const MAX_FILE_SIZE_MB = Number(process.env.AP_MAX_FILE_SIZE_MB)

export type DefaultFileSystem = 'db' | 'local'

type CreateFilesServiceParams = { apiUrl: string, stepName: string, flowId: string, engineToken: string }

export function createFilesService({ stepName, flowId, engineToken, apiUrl }: CreateFilesServiceParams): FilesService {
    return {
        async write({ fileName, data }: { fileName: string, data: Buffer }): Promise<string> {
            const formData = new FormData()
            formData.append('stepName', stepName)
            formData.append('flowId', flowId)
            formData.append('file', new Blob([data], { type: 'application/octet-stream' }), fileName)

            const maximumFileSizeInBytes = MAX_FILE_SIZE_MB * 1024 * 1024
            if (data.length > maximumFileSizeInBytes) {
                throw new FileSizeError(data.length / 1024 / 1024, MAX_FILE_SIZE_MB)
            }

            const fetchWithRetry = fetchRetry(global.fetch)

            const response = await fetchWithRetry(apiUrl + 'v1/step-files', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + engineToken,
                },
                retryDelay: 2000,
                retries: 3,
                body: formData,
            })

            if (!response.ok) {
                throw new FileStoreError(response.body)
            }

            const result = await response.json()
            return result.url
        },
    }
}
