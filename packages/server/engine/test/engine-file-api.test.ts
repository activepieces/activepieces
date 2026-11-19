import { promisify } from 'node:util'
import { zstdCompress as zstdCompressCallback } from 'node:zlib'
import { FileType } from '@activepieces/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { engineFileApi } from '../src/lib/api/engine-file-api'

const zstdCompress = promisify(zstdCompressCallback)

const PARAMS = {
    engineToken: 'test-token',
    apiUrl: 'http://localhost:3000/',
    fileId: 'file-1',
}

describe('engineFileApi.download zstd auto-decompression', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('returns plain bytes untouched when the server already decompressed', async () => {
        const plain = new TextEncoder().encode(JSON.stringify({ hello: 'world' }))
        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(plain, { status: 200 }))

        const bytes = await engineFileApi.download(PARAMS)

        expect(new TextDecoder().decode(bytes)).toBe('{"hello":"world"}')
    })

    it('decompresses raw zstd bytes — covers the S3 signed-URL redirect path on RESUME', async () => {
        // Simulates the path where the server 307s to S3 and the engine receives the
        // file exactly as it was uploaded — zstd-compressed for FLOW_RUN_LOG.
        const original = Buffer.from(JSON.stringify({ executionState: { steps: { trigger: { output: { ok: true } } }, tags: [] } }))
        const compressed = await zstdCompress(original)
        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(new Uint8Array(compressed), { status: 200 }))

        const bytes = await engineFileApi.download(PARAMS)

        expect(JSON.parse(new TextDecoder().decode(bytes))).toEqual({
            executionState: { steps: { trigger: { output: { ok: true } } }, tags: [] },
        })
    })
})

describe('engineFileApi.upload file-name headers', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    async function uploadAndCaptureHeaders(fileName: string): Promise<Headers> {
        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ readUrl: 'http://localhost:3000/v1/files/file-1' }), { status: 200 }),
        )
        await engineFileApi.upload({
            ...PARAMS,
            type: FileType.FLOW_STEP_FILE,
            fileName,
            data: Buffer.from('payload'),
        })
        return new Headers(fetchSpy.mock.calls[0][1]?.headers)
    }

    it.each([
        { fileName: 'résumé.pdf', ascii: 'resume.pdf' },
        { fileName: 'Lettre – Élodie.pdf', ascii: 'Lettre _ Elodie.pdf' },
        { fileName: '報告書.json', ascii: '___.json' },
        { fileName: 'evil\r\nX-Injected: 1.json', ascii: 'evil__X-Injected: 1.json' },
    ])('sends $fileName as printable ASCII plus a lossless encoded copy', async ({ fileName, ascii }) => {
        const headers = await uploadAndCaptureHeaders(fileName)

        expect(headers.get('x-ap-file-name')).toBe(ascii)
        expect(headers.get('x-ap-file-name')).toMatch(/^[\x20-\x7e]*$/)
        expect(decodeURIComponent(headers.get('x-ap-file-name-encoded') ?? '')).toBe(fileName)
    })

    it.each([
        { fileName: 'cut\uD83D.pdf', ascii: 'cut_.pdf', decoded: 'cut\uFFFD.pdf' },
        { fileName: '\uDE00lone-low.pdf', ascii: '_lone-low.pdf', decoded: '\uFFFDlone-low.pdf' },
        { fileName: 'whole \uD83D\uDE00.pdf', ascii: 'whole __.pdf', decoded: 'whole \uD83D\uDE00.pdf' },
    ])('replaces an unpaired surrogate instead of aborting the upload ($fileName)', async ({ fileName, ascii, decoded }) => {
        const headers = await uploadAndCaptureHeaders(fileName)

        expect(headers.get('x-ap-file-name')).toBe(ascii)
        expect(decodeURIComponent(headers.get('x-ap-file-name-encoded') ?? '')).toBe(decoded)
    })

    it('keeps a plain ASCII name unchanged in the legacy header', async () => {
        const headers = await uploadAndCaptureHeaders('invoice.pdf')

        expect(headers.get('x-ap-file-name')).toBe('invoice.pdf')
        expect(headers.get('x-ap-file-name-encoded')).toBe('invoice.pdf')
    })
})

describe('engineFileApi.upload with S3 signed URLs', () => {
    const S3_URL = 'https://bucket.s3.example.com/key?X-Amz-Signature=abc'
    const READ_URL = 'http://localhost:3000/v1/files/file-1?token=read'
    const DATA = Buffer.from('x'.repeat(4096))

    afterEach(() => {
        vi.unstubAllEnvs()
        vi.restoreAllMocks()
    })

    function stubSignedUrls({ signedUrls, location }: { signedUrls: string, location: string }): void {
        vi.stubEnv('AP_S3_USE_SIGNED_URLS', signedUrls)
        vi.stubEnv('AP_FILE_STORAGE_LOCATION', location)
    }

    function redirectToS3(): Response {
        return new Response(null, { status: 307, headers: { 'location': S3_URL, 'x-ap-file-read-url': READ_URL } })
    }

    function sentBytes(init: RequestInit | undefined): Buffer {
        const body = init?.body
        if (!(body instanceof Uint8Array)) {
            throw new Error('expected the request body to be a Uint8Array')
        }
        return Buffer.from(body)
    }

    function upload(): ReturnType<typeof engineFileApi.upload> {
        return engineFileApi.upload({ ...PARAMS, type: FileType.FLOW_RUN_LOG_SLICE, data: DATA })
    }

    it('asks the API for a signed URL without the body, then sends the body once, straight to S3', async () => {
        stubSignedUrls({ signedUrls: 'true', location: 'S3' })
        const fetchSpy = vi.spyOn(global, 'fetch')
            .mockResolvedValueOnce(redirectToS3())
            .mockResolvedValueOnce(new Response(null, { status: 200 }))

        const result = await upload()

        expect(result).toEqual({ fileId: 'file-1', readUrl: READ_URL })
        expect(fetchSpy).toHaveBeenCalledTimes(2)

        const [apiUrl, apiInit] = fetchSpy.mock.calls[0]
        const apiHeaders = new Headers(apiInit?.headers)
        expect(String(apiUrl)).toContain('/v1/files/file-1?token=')
        expect(apiInit?.method).toBe('PUT')
        expect(apiInit?.body).toBeUndefined()
        expect(apiHeaders.get('x-ap-upload-mode')).toBe('signed-url')
        expect(apiHeaders.get('x-ap-file-size')).toBe(String(DATA.length))
        expect(apiHeaders.get('content-length')).toBeNull()

        const [s3Url, s3Init] = fetchSpy.mock.calls[1]
        const s3Headers = new Headers(s3Init?.headers)
        expect(String(s3Url)).toBe(S3_URL)
        expect(sentBytes(s3Init).equals(DATA)).toBe(true)
        expect(s3Headers.get('content-length')).toBe(String(DATA.length))
        expect([...s3Headers.keys()].filter((key) => key.startsWith('x-ap-'))).toEqual([])
    })

    it('sends the body to the API when it answers without a signed URL', async () => {
        stubSignedUrls({ signedUrls: 'true', location: 'S3' })
        const fetchSpy = vi.spyOn(global, 'fetch')
            .mockResolvedValueOnce(new Response(null, { status: 204 }))
            .mockResolvedValueOnce(new Response(JSON.stringify({ readUrl: READ_URL }), { status: 200 }))

        const result = await upload()

        expect(result).toEqual({ fileId: 'file-1', readUrl: READ_URL })
        expect(fetchSpy).toHaveBeenCalledTimes(2)
        const [, bodyInit] = fetchSpy.mock.calls[1]
        expect(sentBytes(bodyInit).equals(DATA)).toBe(true)
        expect(new Headers(bodyInit?.headers).get('x-ap-upload-mode')).toBeNull()
    })

    it('fails without sending the body when the API rejects the signed-URL request', async () => {
        stubSignedUrls({ signedUrls: 'true', location: 'S3' })
        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(null, { status: 401, statusText: 'Unauthorized' }))

        await expect(upload()).rejects.toThrow('Failed to upload engine file file-1: 401 Unauthorized')
        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it.each([
        { signedUrls: 'false', location: 'S3' },
        { signedUrls: 'true', location: 'DB' },
    ])('sends the body to the API in one request when signed URLs=$signedUrls and storage=$location', async ({ signedUrls, location }) => {
        stubSignedUrls({ signedUrls, location })
        const fetchSpy = vi.spyOn(global, 'fetch')
            .mockResolvedValueOnce(new Response(JSON.stringify({ readUrl: READ_URL }), { status: 200 }))

        const result = await upload()

        expect(result).toEqual({ fileId: 'file-1', readUrl: READ_URL })
        expect(fetchSpy).toHaveBeenCalledTimes(1)
        const [, init] = fetchSpy.mock.calls[0]
        expect(sentBytes(init).equals(DATA)).toBe(true)
        expect(new Headers(init?.headers).get('x-ap-upload-mode')).toBeNull()
    })
})
