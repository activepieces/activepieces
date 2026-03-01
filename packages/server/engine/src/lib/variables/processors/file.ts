import { ApFile } from '@activepieces/pieces-framework'
import { isNil, isString } from '@activepieces/shared'
import axios from 'axios'
import mime from 'mime-types'
import { ProcessorFn } from './types'

export const fileProcessor: ProcessorFn = async (_property, urlOrBase64) => {
    if (isNil(urlOrBase64) || !isString(urlOrBase64)) {
        return null
    }
    try {
        if (urlOrBase64.startsWith('data:')) {
            return handleBase64File(urlOrBase64)
        }
        const file = handleBase64File(urlOrBase64)
        if (!isNil(file)) {
            return file
        }
        return await handleUrlFile(urlOrBase64)
    }
    catch (e) {
        console.error(e)
        return null
    }
}

function handleBase64File(propertyValue: string): ApFile | null {
    // Use string operations instead of regex on the full value to avoid
    // "Maximum call stack size exceeded" errors with large Base64 payloads
    const base64Marker = ';base64,'
    if (!propertyValue.startsWith('data:')) {
        return null
    }
    const markerIndex = propertyValue.indexOf(base64Marker)
    if (markerIndex === -1) {
        return null
    }
    const mimeType = propertyValue.slice('data:'.length, markerIndex)
    const base64 = propertyValue.slice(markerIndex + base64Marker.length).trim()
    if (!mimeType || !base64) {
        return null
    }
    const extension = mime.extension(mimeType) || 'bin'
    return new ApFile(
        `unknown.${extension}`,
        Buffer.from(base64, 'base64'),
        extension,
    )
}

async function handleUrlFile(path: string): Promise<ApFile | null> {
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


function getFileName(path: string, disposition: string | null, mimeType: string | undefined): string | null {
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