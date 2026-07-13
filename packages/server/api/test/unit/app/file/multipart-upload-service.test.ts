import { isNil } from '@activepieces/core-utils'
import { FileLocation, FileType } from '@activepieces/shared'
import { multipartUploadService } from '../../../../src/app/file/multipart-upload.service'

const { mockRepo, mockS3, state } = vi.hoisted(() => {
    const state = {
        deleted: false,
        createFails: false,
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
        createMultipartUpload: vi.fn(async () => {
            if (state.createFails) {
                throw new Error('S3 create failed')
            }
            return 'upload-1'
        }),
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

const ENV_KEYS = ['AP_FILE_STORAGE_LOCATION', 'AP_MAX_STREAM_FILE_SIZE_MB'] as const
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

function create() {
    return multipartUploadService.create({
        fileId: 'file-1',
        type: FileType.FLOW_STEP_FILE,
        fileName: 'upload.bin',
        projectId: 'proj',
        platformId: 'plat',
        log,
    })
}

describe('multipartUploadService.create (S3)', () => {
    beforeEach(() => {
        state.deleted = false
        state.createFails = false
        vi.clearAllMocks()
        process.env.AP_FILE_STORAGE_LOCATION = FileLocation.S3
        process.env.AP_MAX_STREAM_FILE_SIZE_MB = '16'
    })

    it('reserves the placeholder and returns the S3 session', async () => {
        const result = await create()
        expect(result).toEqual({ mode: 'S3', uploadId: 'upload-1', maxSizeBytes: 16 * 1024 * 1024 })
        expect(state.deleted).toBe(false)
    })

    it('deletes the placeholder row and rethrows when S3 create fails', async () => {
        state.createFails = true
        await expect(create()).rejects.toThrow('S3 create failed')
        expect(state.deleted).toBe(true)
    })
})
