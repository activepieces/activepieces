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
        ).rejects.toThrow('Expected file data to be a Buffer, but received [object Object]')
    })

    it('throws when data is a string', async () => {
        const files = createFileUploader(SERVICE_PARAMS)
        await expect(
            files.write({ fileName: 'test.txt', data: 'hello' as any }),
        ).rejects.toThrow('Expected file data to be a Buffer, but received string')
    })

    it('throws when data is undefined', async () => {
        const files = createFileUploader(SERVICE_PARAMS)
        await expect(
            files.write({ fileName: 'test.txt', data: undefined as any }),
        ).rejects.toThrow('Expected file data to be a Buffer, but received undefined')
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
