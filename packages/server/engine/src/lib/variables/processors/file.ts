import { ApFile } from '@activepieces/pieces-framework'
import { isBase64, isNil, isString } from '@activepieces/shared'
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
    const extension = mimeExtension(matches[1]) || 'bin'
    return new ApFile(
        `unknown.${extension}`,
        Buffer.from(base64, 'base64'),
        extension,
    )
}

async function handleUrlFile(path: string): Promise<ApFile | null> {
    const fileResponse = await fetch(path)

    const filename = getFileName(path, fileResponse.headers.get('content-disposition'), fileResponse.headers.get('content-type') ?? undefined) ?? 'unknown'
    const extension = filename.split('.').length > 1 ? filename.split('.').pop() : undefined

    return new ApFile(
        filename,
        Buffer.from(await fileResponse.arrayBuffer()),
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
        const resolvedExtension = mimeType ? mimeExtension(mimeType) : null
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

function mimeExtension(mimeType: string): string | null {
    const normalized = mimeType.split(';')[0].trim().toLowerCase()
    return MIME_EXTENSIONS[normalized] ?? null
}

const MIME_EXTENSIONS: Record<string, string> = {
    'application/json': 'json',
    'application/pdf': 'pdf',
    'application/xml': 'xml',
    'application/zip': 'zip',
    'application/gzip': 'gz',
    'application/x-7z-compressed': '7z',
    'application/x-tar': 'tar',
    'application/octet-stream': 'bin',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/rtf': 'rtf',
    'application/javascript': 'js',
    'application/x-javascript': 'js',
    'application/x-yaml': 'yaml',
    'application/yaml': 'yaml',
    'application/x-httpd-php': 'php',
    'application/x-sh': 'sh',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'image/x-icon': 'ico',
    'image/vnd.microsoft.icon': 'ico',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/avif': 'avif',
    'text/plain': 'txt',
    'text/html': 'html',
    'text/css': 'css',
    'text/csv': 'csv',
    'text/javascript': 'js',
    'text/markdown': 'md',
    'text/xml': 'xml',
    'text/tab-separated-values': 'tsv',
    'text/yaml': 'yaml',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/mp4': 'm4a',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/webm': 'weba',
    'audio/flac': 'flac',
    'audio/aac': 'aac',
    'video/mp4': 'mp4',
    'video/mpeg': 'mpeg',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/ogg': 'ogv',
    'font/woff': 'woff',
    'font/woff2': 'woff2',
    'font/ttf': 'ttf',
    'font/otf': 'otf',
}