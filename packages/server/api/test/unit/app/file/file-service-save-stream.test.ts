import { Readable } from 'stream'
import { isNil } from '@activepieces/core-utils'
import { FileLocation, FileType } from '@activepieces/shared'
import { fileService } from '../../../../src/app/file/file.service'

const { mockRepo, mockS3, state } = vi.hoisted(() => {
    const state = {
        parts: [] as Buffer[],
        aborted: false,
        deleted: false,
        completed: false,
        uploadedBuffered: false,
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
        uploadFile: vi.fn(async (key: string) => {
            state.uploadedBuffered = true
            return key
        }),
        createMultipartUpload: vi.fn(async () => 'upload-1'),
        uploadPart: vi.fn(async ({ partNumber, body }: { partNumber: number, body: Buffer }) => {
            state.parts.push(body)
            return `etag-${partNumber}`
        }),
        completeMultipartUpload: vi.fn(async () => {
            state.completed = true
        }),
        abortMultipartUpload: vi.fn(async () => {
            state.aborted = true
        }),
        getObjectSize: vi.fn(async () => state.parts.reduce((sum, b) => sum + b.length, 0)),
    }
    return { mockRepo, mockS3, state }
})

vi.mock('../../../../src/app/core/db/repo-factory', () => ({
    repoFactory: () => () => mockRepo,
}))
vi.mock('../../../../src/app/file/s3-helper', () => ({
    s3Helper: () => mockS3,
    STREAMING_URL_EXPIRY_SECONDS: 3600,
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

function saveStream(stream: Readable) {
    return fileService(log).saveStream({
        stream,
        fileName: 'upload.bin',
        type: FileType.FLOW_STEP_FILE,
        projectId: 'proj',
        platformId: 'plat',
    })
}

describe('fileService.saveStream (S3)', () => {
    beforeEach(() => {
        state.parts = []
        state.aborted = false
        state.deleted = false
        state.completed = false
        state.uploadedBuffered = false
        vi.clearAllMocks()
        process.env.AP_FILE_STORAGE_LOCATION = FileLocation.S3
        process.env.AP_MAX_STREAM_FILE_SIZE_MB = '16'
        process.env.AP_MAX_FILE_SIZE_MB = '25'
    })

    it('uploads a sub-part stream in a single buffered PutObject (no multipart)', async () => {
        await saveStream(streamOf(3 * MB))
        expect(mockS3.uploadFile).toHaveBeenCalledTimes(1)
        expect(mockS3.createMultipartUpload).not.toHaveBeenCalled()
    })

    it('streams a multi-part upload and completes it', async () => {
        await saveStream(streamOf(16 * MB))
        expect(mockS3.createMultipartUpload).toHaveBeenCalledTimes(1)
        expect(mockS3.uploadPart).toHaveBeenCalledTimes(2)
        expect(state.completed).toBe(true)
        expect(state.aborted).toBe(false)
    })

    it('aborts the multipart upload and deletes the row when the ceiling is exceeded', async () => {
        await expect(saveStream(streamOf(24 * MB))).rejects.toThrow()
        expect(state.aborted).toBe(true)
        expect(state.deleted).toBe(true)
        expect(state.completed).toBe(false)
    })
})

describe('fileService.saveStream (DB fallback)', () => {
    beforeEach(() => {
        state.parts = []
        vi.clearAllMocks()
        process.env.AP_FILE_STORAGE_LOCATION = FileLocation.DB
        process.env.AP_MAX_FILE_SIZE_MB = '16'
        process.env.AP_MAX_STREAM_FILE_SIZE_MB = '1024'
    })

    it('buffers to the DB and never touches S3 multipart', async () => {
        await saveStream(streamOf(4 * MB))
        expect(mockS3.createMultipartUpload).not.toHaveBeenCalled()
        expect(mockRepo.save).toHaveBeenCalled()
    })

    it('throws when the buffered stream exceeds MAX_FILE_SIZE_MB', async () => {
        await expect(saveStream(streamOf(20 * MB))).rejects.toThrow()
    })
})
