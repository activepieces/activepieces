import { Readable } from 'node:stream'
import { EngineGenericError, FileSizeError } from '@activepieces/shared'
import { createFileUploader } from '../../src/lib/piece-context/file-uploader'

const SERVICE_PARAMS = {
    engineToken: 'test-token',
    apiUrl: 'http://localhost:3000/',
}

const MEGABYTE = 1024 * 1024

function repeatingStream({ chunk, count }: { chunk: Buffer, count: number }): { stream: Readable, reads: () => number } {
    let reads = 0
    const stream = new Readable({
        highWaterMark: chunk.length,
        read() {
            reads += 1
            this.push(reads <= count ? chunk : null)
        },
    })
    return { stream, reads: () => reads }
}

describe('file-uploader service', () => {

    beforeEach(() => {
        process.env.AP_MAX_FILE_SIZE_MB = '10'
        vi.restoreAllMocks()
    })

    it('throws when data is a plain Object', async () => {
        const files = createFileUploader(SERVICE_PARAMS)
        await expect(
            files.write({ fileName: 'test.txt', data: {} as any }),
        ).rejects.toThrow('Expected file data to be a Buffer or Readable stream, but received [object Object]')
    })

    it('throws when data is a string', async () => {
        const files = createFileUploader(SERVICE_PARAMS)
        await expect(
            files.write({ fileName: 'test.txt', data: 'hello' as any }),
        ).rejects.toThrow('Expected file data to be a Buffer or Readable stream, but received string')
    })

    it('throws when data is undefined', async () => {
        const files = createFileUploader(SERVICE_PARAMS)
        await expect(
            files.write({ fileName: 'test.txt', data: undefined as any }),
        ).rejects.toThrow('Expected file data to be a Buffer or Readable stream, but received undefined')
    })

    it('throws when AP_MAX_FILE_SIZE_MB is missing', async () => {
        delete process.env.AP_MAX_FILE_SIZE_MB
        const files = createFileUploader(SERVICE_PARAMS)
        await expect(
            files.write({ fileName: 'test.txt', data: Buffer.from('hello') }),
        ).rejects.toThrow(EngineGenericError)
    })

    it('throws when AP_MAX_FILE_SIZE_MB is not a positive number', async () => {
        process.env.AP_MAX_FILE_SIZE_MB = 'not-a-number'
        const files = createFileUploader(SERVICE_PARAMS)
        await expect(
            files.write({ fileName: 'test.txt', data: Buffer.from('hello') }),
        ).rejects.toThrow(EngineGenericError)
    })

    it('drains a Readable and PUTs it with a Content-Length instead of a chunked body', async () => {
        const readUrl = 'https://api.example.com/v1/files/stream1?token=xyz'
        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
            JSON.stringify({ fileId: 'stream1', readUrl }),
            { status: 200, headers: { 'x-ap-file-read-url': readUrl } },
        ))

        const files = createFileUploader(SERVICE_PARAMS)
        const result = await files.write({
            fileName: 'stream.txt',
            data: Readable.from([Buffer.from('str'), Buffer.from('eamed')]),
        })

        expect(result).toBe(readUrl)
        expect(fetchSpy).toHaveBeenCalledTimes(1)
        const init = fetchSpy.mock.calls[0][1]
        expect(init?.headers).toMatchObject({ 'Content-Length': '8' })
        const body = init?.body
        expect(body).toBeInstanceOf(Uint8Array)
        if (body instanceof Uint8Array) {
            expect(Buffer.from(body).toString()).toBe('streamed')
        }
    })

    it('counts string chunks by their utf8 byte length', async () => {
        const readUrl = 'https://api.example.com/v1/files/stream2?token=xyz'
        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
            null,
            { status: 200, headers: { 'x-ap-file-read-url': readUrl } },
        ))

        const files = createFileUploader(SERVICE_PARAMS)
        await files.write({ fileName: 'accents.txt', data: Readable.from(['éé']) })

        expect(fetchSpy.mock.calls[0][1]?.headers).toMatchObject({ 'Content-Length': '4' })
    })

    it('throws when the stream emits chunks that are neither Buffer nor string', async () => {
        const files = createFileUploader(SERVICE_PARAMS)
        await expect(
            files.write({ fileName: 'test.txt', data: Readable.from([{ nope: true }]) }),
        ).rejects.toThrow('Expected file stream to emit Buffer or string chunks, but received [object Object]')
    })

    it('stops draining, destroys the source and uploads nothing once a stream crosses the cap', async () => {
        process.env.AP_MAX_FILE_SIZE_MB = '1'
        const fetchSpy = vi.spyOn(global, 'fetch')
        const { stream, reads } = repeatingStream({ chunk: Buffer.alloc(MEGABYTE), count: 100 })

        const files = createFileUploader(SERVICE_PARAMS)
        await expect(
            files.write({ fileName: 'big.bin', data: stream }),
        ).rejects.toThrow(FileSizeError)

        expect(stream.destroyed).toBe(true)
        expect(reads()).toBeLessThanOrEqual(3)
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('drains a multi-megabyte stream that fits the cap and declares its full length', async () => {
        const readUrl = 'https://api.example.com/v1/files/big?token=xyz'
        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
            null,
            { status: 200, headers: { 'x-ap-file-read-url': readUrl } },
        ))
        const { stream, reads } = repeatingStream({ chunk: Buffer.alloc(MEGABYTE), count: 8 })

        const files = createFileUploader(SERVICE_PARAMS)
        const result = await files.write({ fileName: 'big.bin', data: stream })

        expect(result).toBe(readUrl)
        expect(fetchSpy.mock.calls[0][1]?.headers).toMatchObject({ 'Content-Length': String(8 * MEGABYTE) })
        expect(reads()).toBe(9)
    })

    it('throws when a Buffer exceeds the size limit', async () => {
        process.env.AP_MAX_FILE_SIZE_MB = '1'
        const files = createFileUploader(SERVICE_PARAMS)
        const oversizedBuffer = Buffer.alloc(MEGABYTE + 1)
        await expect(
            files.write({ fileName: 'big.bin', data: oversizedBuffer }),
        ).rejects.toThrow(/"currentFileSize":"1\.01 MB"/)
    })

    it('returns the read url from the response header on the proxy path', async () => {
        const readUrl = 'https://api.example.com/v1/files/abc123?token=xyz'

        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
            JSON.stringify({ fileId: 'file-1', readUrl }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'x-ap-file-read-url': readUrl,
                },
            },
        ))

        const files = createFileUploader(SERVICE_PARAMS)
        const result = await files.write({ fileName: 'test.txt', data: Buffer.from('hello') })

        expect(result).toBe(readUrl)
        expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('follows the redirect to S3 and uses the header-supplied read url', async () => {
        const readUrl = 'https://api.example.com/v1/files/abc123?token=xyz'
        const s3Url = 'https://s3.example.com/upload?signed=true'

        vi.spyOn(global, 'fetch')
            .mockResolvedValueOnce(new Response(null, {
                status: 307,
                headers: {
                    'x-ap-file-read-url': readUrl,
                    location: s3Url,
                },
            }))
            .mockResolvedValueOnce(new Response(null, { status: 200 }))

        const files = createFileUploader(SERVICE_PARAMS)
        const result = await files.write({ fileName: 'test.txt', data: Buffer.from('hello') })

        expect(result).toBe(readUrl)
        expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('replays a drained stream across the S3 redirect', async () => {
        const readUrl = 'https://api.example.com/v1/files/stream3?token=xyz'
        const s3Url = 'https://s3.example.com/upload?signed=true'

        const fetchSpy = vi.spyOn(global, 'fetch')
            .mockResolvedValueOnce(new Response(null, {
                status: 307,
                headers: {
                    'x-ap-file-read-url': readUrl,
                    location: s3Url,
                },
            }))
            .mockResolvedValueOnce(new Response(null, { status: 200 }))

        const files = createFileUploader(SERVICE_PARAMS)
        const result = await files.write({ fileName: 'stream.txt', data: Readable.from([Buffer.from('streamed')]) })

        expect(result).toBe(readUrl)
        expect(fetchSpy).toHaveBeenCalledTimes(2)
        const s3Body = fetchSpy.mock.calls[1][1]?.body
        expect(s3Body).toBeInstanceOf(Uint8Array)
        if (s3Body instanceof Uint8Array) {
            expect(Buffer.from(s3Body).toString()).toBe('streamed')
        }
    })

    it('throws when the initial PUT fails', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
            'Internal Server Error',
            { status: 500 },
        ))

        const files = createFileUploader(SERVICE_PARAMS)
        await expect(
            files.write({ fileName: 'test.txt', data: Buffer.from('hello') }),
        ).rejects.toThrow(EngineGenericError)
    })

    it('throws when the S3 PUT fails', async () => {
        vi.spyOn(global, 'fetch')
            .mockResolvedValueOnce(new Response(null, {
                status: 307,
                headers: {
                    'x-ap-file-read-url': 'https://api.example.com/v1/files/abc123?token=xyz',
                    location: 'https://s3.example.com/upload?signed=true',
                },
            }))
            .mockResolvedValueOnce(new Response('Upload failed', { status: 403 }))

        const files = createFileUploader(SERVICE_PARAMS)
        await expect(
            files.write({ fileName: 'test.txt', data: Buffer.from('hello') }),
        ).rejects.toThrow(EngineGenericError)
    })
})
