import { EngineGenericError, FileSizeError } from '@activepieces/shared'
import { createFileUploader } from '../../src/lib/piece-context/file-uploader'

const SERVICE_PARAMS = {
    engineToken: 'test-token',
    apiUrl: 'http://localhost:3000/',
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
        ).rejects.toThrow('Expected file data to be a Buffer or stream, but received [object Object]')
    })

    it('throws when data is a string', async () => {
        const files = createFileUploader(SERVICE_PARAMS)
        await expect(
            files.write({ fileName: 'test.txt', data: 'hello' as any }),
        ).rejects.toThrow('Expected file data to be a Buffer or stream, but received string')
    })

    it('throws when data is undefined', async () => {
        const files = createFileUploader(SERVICE_PARAMS)
        await expect(
            files.write({ fileName: 'test.txt', data: undefined as any }),
        ).rejects.toThrow('Expected file data to be a Buffer or stream, but received undefined')
    })

    it('throws when file exceeds size limit', async () => {
        process.env.AP_MAX_FILE_SIZE_MB = '1'
        const files = createFileUploader(SERVICE_PARAMS)
        const twoMbBuffer = Buffer.alloc(2 * 1024 * 1024)
        await expect(
            files.write({ fileName: 'big.bin', data: twoMbBuffer }),
        ).rejects.toThrow(FileSizeError)
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

describe('file-uploader stream path', () => {
    const READ_URL = 'https://api.example.com/v1/files/abc123?token=xyz'
    const PART_SIZE = 8 * 1024 * 1024

    beforeEach(() => {
        process.env.AP_MAX_FILE_SIZE_MB = '10'
        vi.restoreAllMocks()
    })

    type MockOptions = {
        mode?: 'S3' | 'DB'
        maxSizeBytes?: number
        failPartUpload?: boolean
    }

    function mockStreamingFetch({ mode = 'S3', maxSizeBytes = 1024 * 1024 * 1024, failPartUpload = false }: MockOptions = {}) {
        const calls: { url: string, method: string, body: unknown }[] = []
        let partCounter = 0
        vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
            const url = String(input)
            calls.push({ url, method: init?.method ?? 'GET', body: init?.body })
            if (url.includes('/multipart-uploads/part-url')) {
                partCounter += 1
                return new Response(JSON.stringify({ url: `https://s3.example.com/part-${partCounter}` }), { status: 200 })
            }
            if (url.includes('/multipart-uploads/complete')) {
                return new Response(JSON.stringify({ readUrl: READ_URL, size: 0 }), { status: 200 })
            }
            if (url.includes('/multipart-uploads/abort')) {
                return new Response(null, { status: 204 })
            }
            if (url.includes('/multipart-uploads')) {
                const body = mode === 'DB' ? { mode: 'DB' } : { mode: 'S3', uploadId: 'upload-1', maxSizeBytes }
                return new Response(JSON.stringify(body), { status: 200 })
            }
            if (url.startsWith('https://s3.example.com/part-')) {
                if (failPartUpload) {
                    return new Response('part upload failed', { status: 403 })
                }
                return new Response(null, { status: 200, headers: { etag: `"etag-${url.split('-').pop()}"` } })
            }
            // Buffered PUT fallback path
            return new Response(JSON.stringify({ fileId: 'file-1', readUrl: READ_URL }), {
                status: 200,
                headers: { 'x-ap-file-read-url': READ_URL },
            })
        })
        return calls
    }

    async function* toStream(...buffers: Buffer[]): AsyncGenerator<Uint8Array> {
        for (const buffer of buffers) {
            yield buffer
        }
    }

    it('uses the buffered path for streams that fit in a single part', async () => {
        const calls = mockStreamingFetch()
        const files = createFileUploader(SERVICE_PARAMS)

        const result = await files.write({ fileName: 'small.txt', data: toStream(Buffer.from('hello')) })

        expect(result).toBe(READ_URL)
        expect(calls.some(call => call.url.includes('multipart-uploads'))).toBe(false)
        expect(calls.filter(call => call.method === 'PUT')).toHaveLength(1)
    })

    it('uploads a large stream as multipart parts and completes with collected etags', async () => {
        const calls = mockStreamingFetch()
        const files = createFileUploader(SERVICE_PARAMS)
        // 17MB → 3 parts (8 + 8 + 1)
        const stream = toStream(Buffer.alloc(PART_SIZE), Buffer.alloc(PART_SIZE), Buffer.alloc(1024 * 1024))

        const result = await files.write({ fileName: 'big.bin', data: stream })

        expect(result).toBe(READ_URL)
        const partPuts = calls.filter(call => call.url.startsWith('https://s3.example.com/part-'))
        expect(partPuts).toHaveLength(3)
        const completeCall = calls.find(call => call.url.includes('/multipart-uploads/complete'))
        expect(completeCall).toBeDefined()
        const completeBody = JSON.parse(String(completeCall?.body))
        expect(completeBody.parts).toEqual([
            { partNumber: 1, etag: '"etag-1"' },
            { partNumber: 2, etag: '"etag-2"' },
            { partNumber: 3, etag: '"etag-3"' },
        ])
    })

    it('aborts the multipart upload and rethrows when a part upload fails', async () => {
        const calls = mockStreamingFetch({ failPartUpload: true })
        const files = createFileUploader(SERVICE_PARAMS)
        const stream = toStream(Buffer.alloc(PART_SIZE), Buffer.alloc(PART_SIZE))

        await expect(
            files.write({ fileName: 'big.bin', data: stream }),
        ).rejects.toThrow(EngineGenericError)
        expect(calls.some(call => call.url.includes('/multipart-uploads/abort'))).toBe(true)
    })

    it('aborts and throws FileSizeError when the stream exceeds the server ceiling', async () => {
        const calls = mockStreamingFetch({ maxSizeBytes: 10 * 1024 * 1024 })
        const files = createFileUploader(SERVICE_PARAMS)
        const stream = toStream(Buffer.alloc(PART_SIZE), Buffer.alloc(PART_SIZE))

        await expect(
            files.write({ fileName: 'big.bin', data: stream }),
        ).rejects.toThrow(FileSizeError)
        expect(calls.some(call => call.url.includes('/multipart-uploads/abort'))).toBe(true)
        expect(calls.some(call => call.url.includes('/multipart-uploads/complete'))).toBe(false)
    })

    it('buffers the whole stream on DB installs and honors the buffered cap', async () => {
        process.env.AP_MAX_FILE_SIZE_MB = '20'
        const calls = mockStreamingFetch({ mode: 'DB' })
        const files = createFileUploader(SERVICE_PARAMS)
        const stream = toStream(Buffer.alloc(PART_SIZE), Buffer.alloc(PART_SIZE), Buffer.alloc(1024))

        const result = await files.write({ fileName: 'big.bin', data: stream })

        expect(result).toBe(READ_URL)
        expect(calls.some(call => call.url.startsWith('https://s3.example.com/'))).toBe(false)
        expect(calls.filter(call => call.method === 'PUT')).toHaveLength(1)
    })

    it('throws FileSizeError on DB installs when the stream exceeds the buffered cap', async () => {
        process.env.AP_MAX_FILE_SIZE_MB = '10'
        mockStreamingFetch({ mode: 'DB' })
        const files = createFileUploader(SERVICE_PARAMS)
        const stream = toStream(Buffer.alloc(PART_SIZE), Buffer.alloc(PART_SIZE))

        await expect(
            files.write({ fileName: 'big.bin', data: stream }),
        ).rejects.toThrow(FileSizeError)
    })

    it('write routes an async-iterable stream through the multipart path', async () => {
        const calls = mockStreamingFetch()
        const files = createFileUploader(SERVICE_PARAMS)
        const stream = toStream(Buffer.alloc(PART_SIZE), Buffer.alloc(PART_SIZE), Buffer.alloc(1024 * 1024))

        const result = await files.write({ fileName: 'big.bin', data: stream })

        expect(result).toBe(READ_URL)
        expect(calls.filter(call => call.url.startsWith('https://s3.example.com/part-'))).toHaveLength(3)
    })
})
