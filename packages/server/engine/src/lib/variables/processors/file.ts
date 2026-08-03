import { Readable } from 'node:stream'
import { isBase64, isNil, isString } from '@activepieces/core-utils'
import { ApFile, ApStreamingFile, PropertyType } from '@activepieces/pieces-framework'
import { ProcessorFn } from './types'

export const fileProcessor: ProcessorFn = async (property, urlOrBase64) => {
    if (isNil(urlOrBase64) || !isString(urlOrBase64)) {
        return null
    }
    const streaming = property.type === PropertyType.FILE && property.streaming === true
    try {
        if (streaming) {
            return await handleStreamingFile(urlOrBase64)
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

function parseBase64File(propertyValue: string): { extension: string, buffer: Buffer } | null {
    if (!isBase64(propertyValue, { allowMime: true })) {
        return null
    }
    const matches = propertyValue.match(/^data:([A-Za-z-+/]+);base64,(.+)$/) // example match: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD///+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4Ug9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC
    if (!matches || matches?.length !== 3) {
        return null
    }
    return {
        extension: mimeExtension(matches[1]) || 'bin',
        buffer: Buffer.from(matches[2], 'base64'),
    }
}

function handleBase64File(propertyValue: string): ApFile | null {
    const parsed = parseBase64File(propertyValue)
    if (isNil(parsed)) {
        return null
    }
    return new ApFile(
        `unknown.${parsed.extension}`,
        parsed.buffer,
        parsed.extension,
    )
}

async function handleUrlFile(path: string): Promise<ApFile | null> {
    const fileResponse = await fetch(path)

    const filename = getFileName(path, fileResponse.headers.get('content-disposition'), fileResponse.headers.get('content-type') ?? undefined) ?? 'unknown'
    const extension = extensionFromFilename(filename)

    return new ApFile(
        filename,
        Buffer.from(await fileResponse.arrayBuffer()),
        extension,
    )
}

async function handleStreamingFile(propertyValue: string): Promise<ApStreamingFile | null> {
    const parsed = parseBase64File(propertyValue)
    if (!isNil(parsed)) {
        return {
            filename: `unknown.${parsed.extension}`,
            extension: parsed.extension,
            size: parsed.buffer.length,
            body: Readable.from(parsed.buffer),
        }
    }

    const fileResponse = await fetch(propertyValue)
    if (!fileResponse.ok || isNil(fileResponse.body)) {
        await fileResponse.body?.cancel()
        return null
    }
    const filename = getFileName(propertyValue, fileResponse.headers.get('content-disposition'), fileResponse.headers.get('content-type') ?? undefined) ?? 'unknown'
    const extension = extensionFromFilename(filename)
    const contentEncoding = fileResponse.headers.get('content-encoding')
    const contentLength = Number(fileResponse.headers.get('content-length'))
    // undici transparently decompresses gzip/br/deflate but leaves the compressed
    // Content-Length in place, so it would understate the streamed byte count and
    // truncate the destination. Only trust the size when the body is not encoded.
    const sizeIsTrustworthy = (isNil(contentEncoding) || contentEncoding.toLowerCase() === 'identity')
        && Number.isInteger(contentLength) && contentLength > 0

    return {
        filename,
        extension,
        size: sizeIsTrustworthy ? contentLength : undefined,
        // @ts-expect-error -- undici streams a Node web ReadableStream body; the DOM fetch types omit the fromWeb overload
        body: Readable.fromWeb(fileResponse.body),
    }
}


function extensionFromFilename(filename: string): string | undefined {
    const parts = filename.split('.')
    const last = parts.length > 1 ? parts.pop() : undefined
    return last ? last : undefined
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