import fs from 'fs/promises'
import { ApFile, FilesService } from '@activepieces/pieces-framework'

const FILE_PREFIX_URL = 'file://'
const MEMORY_PREFIX_URL = 'memory://'
const MAXIMUM = 4 * 1024 * 1024
const MAXIMUM_MB = MAXIMUM / 1024 / 1024

export type DefaultFileSystem = 'db' | 'local' | 'memory'

type CreateFilesServiceParams = { apiUrl: string, stepName: string, type: DefaultFileSystem, flowId: string, engineToken: string }

export function createFilesService({ stepName, type, flowId, engineToken, apiUrl }: CreateFilesServiceParams): FilesService {
    return {
        async write({ fileName, data }: { fileName: string, data: Buffer }): Promise<string> {
            switch (type) {
                // TODO remove db as it now generates a signed url
                case 'db':
                    return writeDbFile({ stepName, flowId, fileName, data, engineToken, apiUrl })
                case 'local':
                    return writeLocalFile({ stepName, fileName, data })
                case 'memory':
                    return writeMemoryFile({ fileName, data })
            }
        },
    }
}

export const apFileUtils = {
    readApFile,
}


async function readApFile(path: string): Promise<ApFile | null> {
    if (path.startsWith(MEMORY_PREFIX_URL)) {
        return readMemoryFile(path)
    }
    if (path.startsWith(FILE_PREFIX_URL)) {
        return readLocalFile(path)
    }
    return null
}


async function writeMemoryFile({ fileName, data }: { fileName: string, data: Buffer }): Promise<string> {
    try {
        const base64Data = data.toString('base64')
        const base64String = JSON.stringify({ fileName, data: base64Data })
        return `memory://${base64String}`
    }
    catch (error) {
        throw new Error(`Error reading file: ${error}`)
    }
}

async function readMemoryFile(absolutePath: string): Promise<ApFile> {
    try {
        const base64String = absolutePath.replace(MEMORY_PREFIX_URL, '')
        const { fileName, data } = JSON.parse(base64String)
        const calculatedExtension = fileName.includes('.') ? fileName.split('.').pop() : null
        return new ApFile(fileName, Buffer.from(data, 'base64'), calculatedExtension)
    }
    catch (error) {
        throw new Error(`Error reading file: ${error}`)
    }
}


async function writeDbFile({ stepName, flowId, fileName, data, engineToken, apiUrl }: { apiUrl: string, stepName: string, flowId: string, fileName: string, data: Buffer, engineToken: string }): Promise<string> {
    const formData = new FormData()
    formData.append('stepName', stepName)
    formData.append('name', fileName)
    formData.append('flowId', flowId)
    formData.append('file', new Blob([data], { type: 'application/octet-stream' }))

    if (data.length > MAXIMUM) {
        throw new Error(JSON.stringify({
            message: 'File size is larger than maximum supported size in test step mode, please use test flow instead of step as a workaround',
            currentFileSize: `${(data.length / 1024 / 1024).toFixed(2)} MB`,
            maximumSupportSize: `${MAXIMUM_MB.toFixed(2)} MB`,
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
}




async function writeLocalFile({ stepName, fileName, data }: { stepName: string, fileName: string, data: Buffer }): Promise<string> {
    const path = 'tmp/' + stepName + '/' + fileName
    await fs.mkdir('tmp/' + stepName, { recursive: true })
    await fs.writeFile(path, data)
    return FILE_PREFIX_URL + stepName + '/' + fileName

}

async function readLocalFile(absolutePath: string): Promise<ApFile> {
    const path = 'tmp/' + absolutePath.replace(FILE_PREFIX_URL, '')
    const buffer = await fs.readFile(path)
    const filename = absolutePath.split('/').pop()!
    const extension = filename.split('.').pop()!
    return new ApFile(filename, buffer, extension)
}
