import fs from 'fs/promises'
import { ApFile, FilesService } from '@activepieces/pieces-framework'
import { isString } from '@activepieces/shared'
import axios from 'axios'

const DB_PREFIX_URL = 'db://'
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

export function isMemoryFilePath(dbPath: unknown): boolean {
    if (!isString(dbPath)) {
        return false
    }

    return dbPath.startsWith(MEMORY_PREFIX_URL)
}

export function isApFilePath(dbPath: unknown): dbPath is string {
    if (!isString(dbPath)) {
        return false
    }
    return dbPath.startsWith(FILE_PREFIX_URL) || dbPath.startsWith(DB_PREFIX_URL) || dbPath.startsWith(MEMORY_PREFIX_URL)
}

// TODO move to files service as a `read` method .. currently can't be done since the files service requires a flowId and stepName
export async function handleAPFile({ engineToken, path, apiUrl }: { engineToken: string, path: string, apiUrl: string }) {
    if (path.startsWith(MEMORY_PREFIX_URL)) {
        return readMemoryFile(path)
    } else if (path.startsWith(DB_PREFIX_URL)) { // TODO REMOVE DB AS IT NOW GENERATES A SIGNED URL
        return readDbFile({ engineToken, absolutePath: path, apiUrl })
    } else if (path.startsWith(FILE_PREFIX_URL)) {
        return readLocalFile(path)
    } else {
        const fileResponse = await axios.get(path, {
            responseType: 'arraybuffer',
        });

        // Default filename: last part of the URL.
        let filename = path.substring(path.lastIndexOf('/') + 1);

        // Check for filename in the Content-Disposition header.
        const contentDisposition = fileResponse.headers['content-disposition'];
        if (contentDisposition) {
            const contentDispositionFilename = getContentDispositionFileName(contentDisposition);
            if (contentDispositionFilename) {
                filename = contentDispositionFilename;
            }
        }

        // Return the ApFile object
        return new ApFile(
            filename,
            Buffer.from(fileResponse.data, 'binary'),
            // Only take the extension when there is a dot in the filename.
            filename.split('.').length > 1 ? filename.split('.').pop() : undefined,
        );
    }
}

function getContentDispositionFileName(disposition: string): string | null {
    const utf8FilenameRegex = /filename\*=UTF-8''([\w%\-.]+)(?:; ?|$)/i;
    const asciiFilenameRegex = /^filename=(["']?)(.*?[^\\])\1(?:; ?|$)/i;

    let fileName: string | null = null;
    if (utf8FilenameRegex.test(disposition)) {
        const result = utf8FilenameRegex.exec(disposition);
        if (result && result.length > 1) {
            fileName = decodeURIComponent(result[1]);
        }
    } else {
        // prevent ReDos attacks by anchoring the ascii regex to string start and
        // slicing off everything before 'filename='
        const filenameStart = disposition.toLowerCase().indexOf('filename=');
        if (filenameStart >= 0) {
            const partialDisposition = disposition.slice(filenameStart);
            const matches = asciiFilenameRegex.exec(partialDisposition);
            if (matches != null && matches[2]) {
                fileName = matches[2];
            }
        }
    }
    return fileName;
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

async function readDbFile({ engineToken, absolutePath, apiUrl }: { engineToken: string, absolutePath: string, apiUrl: string }): Promise<ApFile> {
    const fileId = absolutePath.replace(DB_PREFIX_URL, '')
    const response = await fetch(`${apiUrl}v1/step-files/${encodeURIComponent(fileId)}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + engineToken,
        },
    })
    if (!response.ok) {
        throw new Error(`error=db_file_not_found id=${absolutePath}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const contentDisposition = response.headers.get('Content-Disposition')
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
    const filename = filenameMatch ? filenameMatch[1] : 'unknown'
    const extension = filename.split('.').pop()!
    return new ApFile(filename, Buffer.from(arrayBuffer), extension)
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
