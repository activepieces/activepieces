import { FileSizeError, FileStoreError } from '@activepieces/shared'
import { createFileUploader } from '../../src/lib/piece-context/file-uploader'

const SERVICE_PARAMS = {
    stepName: 'step_1',
    flowId: 'flow-id',
    engineToken: 'test-token',
    apiUrl: 'http://localhost:3000/',
}

describe('file-uploader service', () => {

    beforeEach(() => {
        process.env.AP_MAX_FILE_SIZE_MB = '10'
        process.env.AP_FILE_STORAGE_LOCATION = 'DB'
        process.env.AP_S3_USE_SIGNED_URLS = 'false'
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

    it('direct upload returns result url', async () => {
        const mockUrl = 'http://localhost:3000/files/abc123'
        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
            JSON.stringify({ url: mockUrl, uploadUrl: null }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        ))

        const files = createFileUploader(SERVICE_PARAMS)
        const result = await files.write({ fileName: 'test.txt', data: Buffer.from('hello') })

        expect(result).toBe(mockUrl)
        expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('signed URL upload posts metadata then PUTs to signed URL', async () => {
        process.env.AP_FILE_STORAGE_LOCATION = 'S3'
        process.env.AP_S3_USE_SIGNED_URLS = 'true'

        const signedUrl = 'https://s3.example.com/upload?signed=true'
        const resultUrl = 'https://s3.example.com/files/abc123'

        vi.spyOn(global, 'fetch')
            .mockResolvedValueOnce(new Response(
                JSON.stringify({ url: resultUrl, uploadUrl: signedUrl }),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
            ))
            .mockResolvedValueOnce(new Response(null, { status: 200 }))

        const files = createFileUploader(SERVICE_PARAMS)
        const result = await files.write({ fileName: 'test.txt', data: Buffer.from('hello') })

        expect(result).toBe(resultUrl)
        expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('throws FileStoreError when upload URL is missing in signed mode', async () => {
        process.env.AP_FILE_STORAGE_LOCATION = 'S3'
        process.env.AP_S3_USE_SIGNED_URLS = 'true'

        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
            JSON.stringify({ url: 'https://s3.example.com/files/abc123', uploadUrl: null }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        ))

        const files = createFileUploader(SERVICE_PARAMS)
        await expect(
            files.write({ fileName: 'test.txt', data: Buffer.from('hello') }),
        ).rejects.toThrow(FileStoreError)
    })

    it('throws FileStoreError when metadata upload fails', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
            'Internal Server Error',
            { status: 500 },
        ))

        const files = createFileUploader(SERVICE_PARAMS)
        await expect(
            files.write({ fileName: 'test.txt', data: Buffer.from('hello') }),
        ).rejects.toThrow(FileStoreError)
    })

    it('throws FileStoreError when signed URL PUT fails', async () => {
        process.env.AP_FILE_STORAGE_LOCATION = 'S3'
        process.env.AP_S3_USE_SIGNED_URLS = 'true'

        const signedUrl = 'https://s3.example.com/upload?signed=true'
        vi.spyOn(global, 'fetch')
            .mockResolvedValueOnce(new Response(
                JSON.stringify({ url: 'https://s3.example.com/files/abc123', uploadUrl: signedUrl }),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
            ))
            .mockResolvedValueOnce(new Response('Upload failed', { status: 403 }))

        const files = createFileUploader(SERVICE_PARAMS)
        await expect(
            files.write({ fileName: 'test.txt', data: Buffer.from('hello') }),
        ).rejects.toThrow(FileStoreError)
    })
})
