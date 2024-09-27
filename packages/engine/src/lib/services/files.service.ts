import { FilesService } from '@activepieces/pieces-framework'

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
                throw new Error(JSON.stringify({
                    message: 'File size is larger than maximum supported size in test step mode, please use test flow instead of step as a workaround',
                    currentFileSize: `${(data.length / 1024 / 1024).toFixed(2)} MB`,
                    maximumSupportSize: `${MAX_FILE_SIZE_MB.toFixed(2)} MB`,
                }))
            }

            const response = await fetch(apiUrl + 'v1/step-files', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + engineToken,
                },
                body: formData,
            })

            if (!response.ok) {
                throw new Error('Failed to store entry ' + response.body)
            }

            const result = await response.json()
            return result.url
        },
    }
}
