import { ApFile } from '@activepieces/pieces-framework'
import { isNil, isString } from '@activepieces/shared'
import axios from 'axios'
import isBase64 from 'is-base64'
import mime from 'mime-types'
import { ProcessorFn } from './types'

export const fileProcessor: ProcessorFn = async (_property, urlOrBase64) => {
    if (isNil(urlOrBase64) || !isString(urlOrBase64)) {
        return null
    }
    try {
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
    if (!isBase64(propertyValue, { allowMime: true })) {
        return null
    }
    const matches = propertyValue.match(/^data:([A-Za-z-+/]+);base64,(.+)$/) // example match: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD///+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4Ug9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC
    if (!matches || matches?.length !== 3) {
        return null
    }
    const base64 = matches[2]
    const extension = mime.extension(matches[1]) || 'bin'
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