import { ApFile } from '@activepieces/pieces-framework'
import { isNil } from '@activepieces/shared'
import axios from 'axios'
import mime from 'mime-types'

export async function handleUrlFile(path: string): Promise<ApFile | null> {
    const fileResponse = await axios.get(path, {
        responseType: 'arraybuffer',
    })


    const filename = getFileName(path, fileResponse.headers['content-disposition'], fileResponse.headers['content-type']) ?? 'unknown'
    const extension = filename.split('.').length > 1 ? filename.split('.').pop() : undefined

    return new ApFile(
        filename,
        Buffer.from(fileResponse.data, 'binary'),
        extension,
    )
}

export function getFileName(path: string, disposition: string | null, mimeType: string | undefined): string | null {
    const url = new URL(path)
    if (isNil(disposition)) {
        const fileNameFromUrl = url.pathname.includes('/') && url.pathname.split('/').pop()?.includes('.') ? url.pathname.split('/').pop() : null
        if (!isNil(fileNameFromUrl)) {
            return fileNameFromUrl
        }
        const resolvedExtension = mimeType ? mime.extension(mimeType) : null
        return `unknown.${resolvedExtension ?? 'bin'}`
    }
    const utf8FilenameRegex = /filename\*=UTF-8''([\w%\-.]+)(?:; ?|$)/i
    if (utf8FilenameRegex.test(disposition)) {
        const result = utf8FilenameRegex.exec(disposition)
        if (result && result.length > 1) {
            return decodeURIComponent(result[1])
        }
    }
    // prevent ReDos attacks by anchoring the ascii regex to string start and
    // slicing off everything before 'filename='
    const filenameStart = disposition.toLowerCase().indexOf('filename=')
    const asciiFilenameRegex = /^filename=(["']?)(.*?[^\\])\1(?:; ?|$)/i

    if (filenameStart >= 0) {
        const partialDisposition = disposition.slice(filenameStart)
        const matches = asciiFilenameRegex.exec(partialDisposition)
        if (matches != null && matches[2]) {
            return matches[2]
        }
    }
    return null
}