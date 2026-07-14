import { Readable } from 'node:stream'
import { promisify } from 'node:util'
import { zstdDecompress as zstdDecompressCallback } from 'node:zlib'
import { EngineFileNotFoundError, EngineGenericError, FileCompression, FileType, isZstdCompressed } from '@activepieces/shared'
import fetchRetry from 'fetch-retry'
import { request } from 'undici'

const zstdDecompress = promisify(zstdDecompressCallback)

// Forward to global.fetch at call time (not capture-at-import) so test spies on
// global.fetch are honored and any runtime fetch override still applies.
const fetchWithRetry = fetchRetry((input, init) => global.fetch(input, init))

const RETRY_CONFIG = {
    retries: 3,
    retryDelay: 3000,
} as const

const READ_URL_HEADER = 'x-ap-file-read-url'
const FILE_TYPE_HEADER = 'x-ap-file-type'
const FILE_NAME_HEADER = 'x-ap-file-name'

export const engineFileApi = {
    async upload({ engineToken, apiUrl, fileId, type, fileName, compression, data }: UploadParams): Promise<UploadResult> {
        const headers = buildPutHeaders({ type, fileName, compression, contentLength: data.length })
        const putUrl = `${apiUrl}v1/files/${fileId}?token=${encodeURIComponent(engineToken)}`

        const initial = await fetchWithRetry(putUrl, {
            method: 'PUT',
            body: data,
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
                body: data,
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
    async createStreamUpload({ engineToken, apiUrl, fileId, fileName, contentType, size }: CreateStreamUploadParams): Promise<CreateStreamUploadResponse> {
        return postJson<CreateStreamUploadResponse>({
            engineToken,
            url: `${apiUrl}v1/files/${fileId}/stream-upload`,
            body: { type: FileType.FLOW_STEP_FILE, fileName, contentType, size },
        })
    },
    async putStream({ url, stream, size }: PutStreamParams): Promise<void> {
        // undici.request streams a Node Readable body natively (no DOM BodyInit / duplex
        // dance that global.fetch needs). A single streamed PUT can't be retried — the
        // stream is consumed once. Content-Length is sent explicitly; the presigned URL
        // does not sign it, so S3-compatible providers accept the value verbatim.
        const { statusCode, body } = await request(url, {
            method: 'PUT',
            body: stream,
            headers: { 'content-length': String(size) },
        })
        await body.dump()
        if (statusCode < 200 || statusCode >= 300) {
            throw new EngineGenericError('EngineFileUploadError', `Failed to stream file to signed S3 URL: ${statusCode}`)
        }
    },
    async download({ engineToken, apiUrl, fileId }: DownloadFileParams): Promise<Uint8Array> {
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

async function postJson<T>({ engineToken, url, body }: PostJsonParams): Promise<T> {
    const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${engineToken}`,
        },
        body: JSON.stringify(body),
        ...RETRY_CONFIG,
    })
    if (!response.ok) {
        throw new EngineGenericError('EngineFileUploadError', `Streaming upload request to ${new URL(url).pathname} failed: ${response.status} ${response.statusText}`)
    }
    const text = await response.text()
    return (text.length === 0 ? undefined : JSON.parse(text)) as T
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

type DownloadFileParams = {
    engineToken: string
    apiUrl: string
    fileId: string
}

type CreateStreamUploadParams = {
    engineToken: string
    apiUrl: string
    fileId: string
    fileName?: string
    contentType?: string
    size: number
}

// Local wire type matching stream-upload.service.ts — this file deliberately duplicates
// it instead of importing server types (matches the header-constant duplication above).
export type CreateStreamUploadResponse =
    | { mode: 'DB' }
    | { mode: 'S3', url: string, readUrl: string }

type PutStreamParams = {
    url: string
    stream: Readable
    size: number
}

type PostJsonParams = {
    engineToken: string
    url: string
    body: unknown
}

type BuildHeadersParams = {
    type: FileType
    fileName?: string
    compression?: FileCompression
    contentLength: number
}
