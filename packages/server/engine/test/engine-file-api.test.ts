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
