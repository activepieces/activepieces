import { EngineGenericError, FileSizeError } from '@activepieces/shared'
import { createFileUploader } from '../../src/lib/piece-context/file-uploader'

const { mockUndiciRequest } = vi.hoisted(() => ({
    mockUndiciRequest: vi.fn(async () => ({ statusCode: 200, body: { dump: async () => undefined } })),
}))
vi.mock('undici', () => ({ request: mockUndiciRequest }))

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
    const S3_PUT_URL = 'https://s3.example.com/put?signed=true'
    const MB = 1024 * 1024

    beforeEach(() => {
        process.env.AP_MAX_FILE_SIZE_MB = '10'
        vi.restoreAllMocks()
        mockUndiciRequest.mockReset()
        mockUndiciRequest.mockResolvedValue({ statusCode: 200, body: { dump: async () => undefined } })
    })

    type MockOptions = {
        mode?: 'S3' | 'DB'
        createStatus?: number
    }

    function mockStreamingFetch({ mode = 'S3', createStatus = 200 }: MockOptions = {}) {
        const calls: { url: string, method: string, body: unknown }[] = []
        vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
            const url = String(input)
            calls.push({ url, method: init?.method ?? 'GET', body: init?.body })
            if (url.includes('/stream-upload')) {
                if (createStatus !== 200) {
                    return new Response('rejected', { status: createStatus })
                }
                const body = mode === 'DB' ? { mode: 'DB' } : { mode: 'S3', url: S3_PUT_URL, readUrl: READ_URL }
                return new Response(JSON.stringify(body), { status: 200 })
            }
            // Buffered PUT fallback path (`PUT /v1/files/:id`)
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

    it('throws when a stream is written without a size', async () => {
        const files = createFileUploader(SERVICE_PARAMS)
        await expect(
            files.write({ fileName: 'big.bin', data: toStream(Buffer.alloc(MB)) }),
        ).rejects.toThrow('Streaming file writes require a numeric `size`')
    })

    it('streams to S3 via a single presigned PUT (undici) and returns the read url', async () => {
        const calls = mockStreamingFetch()
        const files = createFileUploader(SERVICE_PARAMS)

        const result = await files.write({ fileName: 'big.bin', data: toStream(Buffer.alloc(20 * MB)), size: 20 * MB })

        expect(result).toBe(READ_URL)
        expect(calls.filter(call => call.url.includes('/stream-upload'))).toHaveLength(1)
        expect(mockUndiciRequest).toHaveBeenCalledTimes(1)
        const [putUrl, putInit] = mockUndiciRequest.mock.calls[0] as unknown as [string, { method: string, headers: Record<string, string> }]
        expect(putUrl).toBe(S3_PUT_URL)
        expect(putInit.method).toBe('PUT')
        expect(putInit.headers['content-length']).toBe(String(20 * MB))
    })

    it('throws when the S3 stream PUT fails', async () => {
        mockStreamingFetch()
        mockUndiciRequest.mockResolvedValueOnce({ statusCode: 403, body: { dump: async () => undefined } })
        const files = createFileUploader(SERVICE_PARAMS)

        await expect(
            files.write({ fileName: 'big.bin', data: toStream(Buffer.alloc(20 * MB)), size: 20 * MB }),
        ).rejects.toThrow(EngineGenericError)
    })

    it('throws when the server rejects the declared size', async () => {
        mockStreamingFetch({ createStatus: 400 })
        const files = createFileUploader(SERVICE_PARAMS)

        await expect(
            files.write({ fileName: 'big.bin', data: toStream(Buffer.alloc(20 * MB)), size: 20 * MB }),
        ).rejects.toThrow(EngineGenericError)
        expect(mockUndiciRequest).not.toHaveBeenCalled()
    })

    it('buffers the whole stream on DB installs and honors the buffered cap', async () => {
        process.env.AP_MAX_FILE_SIZE_MB = '20'
        const calls = mockStreamingFetch({ mode: 'DB' })
        const files = createFileUploader(SERVICE_PARAMS)
        const stream = toStream(Buffer.alloc(8 * MB), Buffer.alloc(8 * MB), Buffer.alloc(1024))

        const result = await files.write({ fileName: 'big.bin', data: stream, size: 16 * MB + 1024 })

        expect(result).toBe(READ_URL)
        expect(mockUndiciRequest).not.toHaveBeenCalled()
        expect(calls.filter(call => call.method === 'PUT')).toHaveLength(1)
    })

    it('throws FileSizeError on DB installs when the stream exceeds the buffered cap', async () => {
        process.env.AP_MAX_FILE_SIZE_MB = '10'
        mockStreamingFetch({ mode: 'DB' })
        const files = createFileUploader(SERVICE_PARAMS)
        const stream = toStream(Buffer.alloc(8 * MB), Buffer.alloc(8 * MB))

        await expect(
            files.write({ fileName: 'big.bin', data: stream, size: 16 * MB }),
        ).rejects.toThrow(FileSizeError)
    })
})
