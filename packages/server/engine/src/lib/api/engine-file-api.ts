import { Readable } from 'node:stream'
import { promisify } from 'node:util'
import { zstdDecompress as zstdDecompressCallback } from 'node:zlib'
import { EngineFileNotFoundError, EngineGenericError, FileCompression, FileSizeError, FileType, isZstdCompressed } from '@activepieces/shared'
import fetchRetry from 'fetch-retry'
import { request } from 'undici'

const zstdDecompress = promisify(zstdDecompressCallback)

const RETRY_CONFIG = {
    retries: 3,
    retryDelay: 3000,
} as const

const READ_URL_HEADER = 'x-ap-file-read-url'
const FILE_TYPE_HEADER = 'x-ap-file-type'
const FILE_NAME_HEADER = 'x-ap-file-name'

export const engineFileApi = {
    async upload({ engineToken, apiUrl, fileId, type, fileName, compression, data }: UploadParams): Promise<UploadResult> {
        const fetchWithRetry = fetchRetry(global.fetch)
        const headers = buildPutHeaders({ type, fileName, compression, contentLength: data.length })
        const putUrl = `${apiUrl}v1/files/${fileId}?token=${encodeURIComponent(engineToken)}`
        // DOM's fetch BodyInit requires an ArrayBuffer-backed view; Node's Buffer/Uint8Array is
        // typed <ArrayBufferLike> (could be SharedArrayBuffer), so copy into a plain Uint8Array once.
        const bytes = new Uint8Array(data)

        const initial = await fetchWithRetry(putUrl, {
            method: 'PUT',
            body: bytes,
            headers,
            redirect: 'manual',
            ...RETRY_CONFIG,
        })

        const readUrlFromHeader = initial.headers.get(READ_URL_HEADER) ?? undefined

        if (initial.status >= 300 && initial.status < 400) {
            const location = initial.headers.get('location')
            if (!location) {
                throw new EngineGenericError('EngineFileUploadError', 'Server returned a redirect without a Location header')
            }
            const s3Response = await fetchWithRetry(location, {
                method: 'PUT',
                body: bytes,
                headers: stripApHeaders(headers),
                redirect: 'follow',
                ...RETRY_CONFIG,
            })
            if (!s3Response.ok) {
                throw new EngineGenericError(
                    'EngineFileUploadError',
                    `Failed to upload to signed S3 URL for ${fileId}: ${s3Response.status} ${s3Response.statusText}`,
                )
            }
            if (!readUrlFromHeader) {
                throw new EngineGenericError('EngineFileUploadError', `Server redirect response missing ${READ_URL_HEADER} header`)
            }
            return { fileId, readUrl: readUrlFromHeader }
        }

        if (!initial.ok) {
            throw new EngineGenericError(
                'EngineFileUploadError',
                `Failed to upload engine file ${fileId}: ${initial.status} ${initial.statusText}`,
            )
        }

        if (readUrlFromHeader) {
            return { fileId, readUrl: readUrlFromHeader }
        }
        const body = await initial.json() as { readUrl?: unknown }
        if (typeof body.readUrl !== 'string') {
            throw new EngineGenericError('EngineFileUploadError', 'Upload response missing readUrl')
        }
        return { fileId, readUrl: body.readUrl }
    },
    async uploadStream({ engineToken, apiUrl, fileId, type, fileName, size, data }: UploadStreamParams): Promise<UploadResult> {
        const target = await preflightUploadTarget({ engineToken, apiUrl, fileId, type, fileName, size })
        if (target.mode === 's3') {
            const s3Response = await request(target.putUrl, {
                method: 'PUT',
                body: data,
                headers: {
                    'content-type': 'application/octet-stream',
                    'content-length': String(size),
                },
            })
            if (s3Response.statusCode >= 300) {
                throw new EngineGenericError('EngineFileUploadError', `Failed to stream file ${fileId} to signed S3 URL: ${s3Response.statusCode}`)
            }
            return { fileId, readUrl: target.readUrl }
        }
        const putUrl = `${apiUrl}v1/files/${fileId}?token=${encodeURIComponent(engineToken)}`
        const proxyResponse = await request(putUrl, {
            method: 'PUT',
            body: data,
            headers: {
                'content-type': 'application/octet-stream',
                'content-length': String(size),
                [FILE_TYPE_HEADER]: type,
                ...(fileName ? { [FILE_NAME_HEADER]: fileName } : {}),
            },
        })
        if (proxyResponse.statusCode >= 300) {
            throw new EngineGenericError('EngineFileUploadError', `Failed to stream file ${fileId}: ${proxyResponse.statusCode}`)
        }
        return { fileId, readUrl: target.readUrl }
    },
    async download({ engineToken, apiUrl, fileId }: DownloadFileParams): Promise<Uint8Array> {
        const fetchWithRetry = fetchRetry(global.fetch)
        const response = await fetchWithRetry(`${apiUrl}v1/files/${fileId}?token=${encodeURIComponent(engineToken)}`, {
            method: 'GET',
            redirect: 'follow',
            ...RETRY_CONFIG,
        })
        if (!response.ok) {
            // A gone file (deleted/expired trigger payload or run log) never recovers on retry and is a
            // data-lifecycle issue, not an engine bug — surface it as a USER error so callers can fail the
            // run cleanly. Other non-ok statuses (5xx, throttling) may be transient, so keep them ENGINE.
            if (response.status === 404 || response.status === 410) {
                throw new EngineFileNotFoundError(fileId)
            }
            throw new EngineGenericError(
                'EngineFileDownloadError',
                `Failed to download file ${fileId}: ${response.status} ${response.statusText}`,
            )
        }
        const raw = new Uint8Array(await response.arrayBuffer())
        // The server's proxy path runs the file through fileCompressor.decompress before
        // streaming it back, but the S3 signed-URL redirect path serves the stored bytes
        // straight from S3 — which for FLOW_RUN_LOG is zstd-compressed. Native fetch does
        // not auto-decompress zstd, so callers (RESUME hydration, slice materialization)
        // would crash on JSON.parse. Detect the magic bytes and decompress here so the
        // download contract is "always returns the original payload" regardless of which
        // server path served it.
        if (isZstdCompressed(raw)) {
            return new Uint8Array(await zstdDecompress(Buffer.from(raw)))
        }
        return raw
    },
}

function buildPutHeaders({ type, fileName, compression, contentLength }: BuildHeadersParams): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(contentLength),
        [FILE_TYPE_HEADER]: type,
    }
    if (fileName) {
        headers[FILE_NAME_HEADER] = fileName
    }
    if (compression === FileCompression.ZSTD) {
        headers['Content-Encoding'] = 'zstd'
    }
    return headers
}

async function preflightUploadTarget({ engineToken, apiUrl, fileId, type, fileName, size }: PreflightParams): Promise<UploadTarget> {
    const fetchWithRetry = fetchRetry(global.fetch)
    const url = `${apiUrl}v1/files/${fileId}/upload-target?token=${encodeURIComponent(engineToken)}`
    const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileType: type, fileName, size }),
        ...RETRY_CONFIG,
    })
    if (response.status === 413) {
        const body = await response.json() as { maxSizeMb?: number }
        throw new FileSizeError(Math.ceil(size / 1024 / 1024), body.maxSizeMb ?? 0)
    }
    if (!response.ok) {
        throw new EngineGenericError('EngineFileUploadError', `Failed to resolve upload target for ${fileId}: ${response.status} ${response.statusText}`)
    }
    return await response.json() as UploadTarget
}

function stripApHeaders(headers: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(headers)) {
        if (!key.toLowerCase().startsWith('x-ap-')) {
            result[key] = value
        }
    }
    return result
}

type UploadParams = {
    engineToken: string
    apiUrl: string
    fileId: string
    type: FileType.FLOW_STEP_FILE | FileType.FLOW_RUN_LOG | FileType.FLOW_RUN_LOG_SLICE
    fileName?: string
    compression?: FileCompression
    data: Uint8Array | Buffer
}

type UploadResult = {
    fileId: string
    readUrl: string
}

type UploadStreamParams = {
    engineToken: string
    apiUrl: string
    fileId: string
    type: FileType.FLOW_STEP_FILE | FileType.FLOW_RUN_LOG | FileType.FLOW_RUN_LOG_SLICE
    fileName?: string
    size: number
    data: Readable
}

type PreflightParams = {
    engineToken: string
    apiUrl: string
    fileId: string
    type: FileType.FLOW_STEP_FILE | FileType.FLOW_RUN_LOG | FileType.FLOW_RUN_LOG_SLICE
    fileName?: string
    size: number
}

type UploadTarget =
    | { mode: 's3', putUrl: string, readUrl: string }
    | { mode: 'proxy', readUrl: string }

type DownloadFileParams = {
    engineToken: string
    apiUrl: string
    fileId: string
}

type BuildHeadersParams = {
    type: FileType
    fileName?: string
    compression?: FileCompression
    contentLength: number
}
