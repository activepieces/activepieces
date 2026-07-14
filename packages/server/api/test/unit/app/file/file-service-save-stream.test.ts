import { Readable } from 'stream'
import { isNil } from '@activepieces/core-utils'
import { FileLocation, FileType } from '@activepieces/shared'
import { fileService } from '../../../../src/app/file/file.service'

const { mockRepo, mockS3, state } = vi.hoisted(() => {
    const state = {
        deleted: false,
        uploadedContentLength: 0,
    }
    const mockRepo = {
        save: vi.fn(async (row: Record<string, unknown>) => row),
        update: vi.fn(async () => ({})),
        delete: vi.fn(async () => {
            state.deleted = true
            return {}
        }),
        findOneBy: vi.fn(async () => null),
    }
    const mockS3 = {
        constructS3Key: vi.fn(async () => 'project/p/flow_step_file/f'),
        uploadFile: vi.fn(async (key: string) => key),
        uploadStream: vi.fn(async ({ body, contentLength }: { body: Readable, contentLength: number }) => {
            // Drain the body so the stream settles, then record the declared length.
            for await (const _chunk of body) { /* discard */ }
            state.uploadedContentLength = contentLength
        }),
    }
    return { mockRepo, mockS3, state }
})

vi.mock('../../../../src/app/core/db/repo-factory', () => ({
    repoFactory: () => () => mockRepo,
}))
vi.mock('../../../../src/app/file/s3-helper', () => ({
    s3Helper: () => mockS3,
}))

const log = { info: () => undefined, error: () => undefined, warn: () => undefined } as never

const ENV_KEYS = ['AP_FILE_STORAGE_LOCATION', 'AP_MAX_STREAM_FILE_SIZE_MB', 'AP_MAX_FILE_SIZE_MB'] as const
const originalEnv: Record<string, string | undefined> = {}

beforeAll(() => {
    for (const key of ENV_KEYS) {
        originalEnv[key] = process.env[key]
    }
})

afterAll(() => {
    for (const key of ENV_KEYS) {
        if (isNil(originalEnv[key])) {
            delete process.env[key]
        }
        else {
            process.env[key] = originalEnv[key]
        }
    }
})

const MB = 1024 * 1024

function streamOf(totalBytes: number): Readable {
    return Readable.from([Buffer.alloc(totalBytes, 1)])
}

function saveStream(stream: Readable, size?: number) {
    return fileService(log).saveStream({
        stream,
        fileName: 'upload.bin',
        type: FileType.FLOW_STEP_FILE,
        projectId: 'proj',
        platformId: 'plat',
        size,
    })
}

describe('fileService.saveStream (S3)', () => {
    beforeEach(() => {
        state.deleted = false
        state.uploadedContentLength = 0
        vi.clearAllMocks()
        process.env.AP_FILE_STORAGE_LOCATION = FileLocation.S3
        process.env.AP_MAX_STREAM_FILE_SIZE_MB = '16'
        process.env.AP_MAX_FILE_SIZE_MB = '25'
    })

    it('streams to S3 with the declared size', async () => {
        await saveStream(streamOf(10 * MB), 10 * MB)
        expect(mockS3.uploadStream).toHaveBeenCalledTimes(1)
        expect(state.uploadedContentLength).toBe(10 * MB)
    })

    it('rejects a declared size over MAX_STREAM_FILE_SIZE_MB before reserving a row', async () => {
        await expect(saveStream(streamOf(1 * MB), 20 * MB)).rejects.toThrow()
        expect(mockRepo.save).not.toHaveBeenCalled()
        expect(mockS3.uploadStream).not.toHaveBeenCalled()
    })

    it('buffers under MAX_FILE_SIZE_MB when the size is unknown', async () => {
        await saveStream(streamOf(4 * MB))
        expect(mockS3.uploadStream).not.toHaveBeenCalled()
        expect(mockS3.uploadFile).toHaveBeenCalledTimes(1)
    })

    it('deletes the row when the S3 upload fails', async () => {
        mockS3.uploadStream.mockRejectedValueOnce(new Error('s3 down'))
        await expect(saveStream(streamOf(4 * MB), 4 * MB)).rejects.toThrow()
        expect(state.deleted).toBe(true)
    })
})

describe('fileService.saveStream (DB fallback)', () => {
    beforeEach(() => {
        state.deleted = false
        vi.clearAllMocks()
        process.env.AP_FILE_STORAGE_LOCATION = FileLocation.DB
        process.env.AP_MAX_FILE_SIZE_MB = '16'
        process.env.AP_MAX_STREAM_FILE_SIZE_MB = '1024'
    })

    it('buffers to the DB and never streams to S3', async () => {
        await saveStream(streamOf(4 * MB), 4 * MB)
        expect(mockS3.uploadStream).not.toHaveBeenCalled()
        expect(mockRepo.save).toHaveBeenCalled()
    })

    it('throws when the buffered stream exceeds MAX_FILE_SIZE_MB', async () => {
        await expect(saveStream(streamOf(20 * MB), 20 * MB)).rejects.toThrow()
    })
})
