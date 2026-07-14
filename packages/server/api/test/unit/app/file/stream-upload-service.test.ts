import { isNil } from '@activepieces/core-utils'
import { FileLocation, FileType } from '@activepieces/shared'
import { streamUploadService } from '../../../../src/app/file/stream-upload.service'

const { mockRepo, mockS3, state } = vi.hoisted(() => {
    const state = {
        deleted: false,
        s3KeyFails: false,
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
        constructS3Key: vi.fn(async () => {
            if (state.s3KeyFails) {
                throw new Error('S3 misconfigured')
            }
            return 'project/p/flow_step_file/f'
        }),
        uploadFile: vi.fn(async (key: string) => key),
        putS3SignedUrl: vi.fn(async () => 'https://s3.example.com/put?signed=true'),
    }
    return { mockRepo, mockS3, state }
})

vi.mock('../../../../src/app/core/db/repo-factory', () => ({
    repoFactory: () => () => mockRepo,
}))
vi.mock('../../../../src/app/file/s3-helper', () => ({
    s3Helper: () => mockS3,
}))
vi.mock('../../../../src/app/file/files-service', () => ({
    filesService: {
        constructReadUrl: vi.fn(async () => 'https://api.example.com/v1/files/f?token=read'),
    },
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

const MB = 1024 * 1024

function create(size: number) {
    return streamUploadService.create({
        fileId: 'file-1',
        type: FileType.FLOW_STEP_FILE,
        fileName: 'upload.bin',
        contentType: 'application/octet-stream',
        size,
        projectId: 'proj',
        platformId: 'plat',
        log,
    })
}

describe('streamUploadService.create', () => {
    beforeEach(() => {
        state.deleted = false
        state.s3KeyFails = false
        vi.clearAllMocks()
        process.env.AP_FILE_STORAGE_LOCATION = FileLocation.S3
        process.env.AP_MAX_STREAM_FILE_SIZE_MB = '16'
    })

    it('reserves a row and returns a presigned PUT url + read url on S3', async () => {
        const result = await create(10 * MB)
        expect(result).toEqual({
            mode: 'S3',
            url: 'https://s3.example.com/put?signed=true',
            readUrl: 'https://api.example.com/v1/files/f?token=read',
        })
        expect(mockRepo.save).toHaveBeenCalledTimes(1)
    })

    it('rejects a size over MAX_STREAM_FILE_SIZE_MB before reserving a row', async () => {
        await expect(create(20 * MB)).rejects.toThrow()
        expect(mockRepo.save).not.toHaveBeenCalled()
    })

    it('returns DB mode without a row when storage is not S3', async () => {
        process.env.AP_FILE_STORAGE_LOCATION = FileLocation.DB
        const result = await create(10 * MB)
        expect(result).toEqual({ mode: 'DB' })
        expect(mockRepo.save).not.toHaveBeenCalled()
    })

    it('degrades to DB when the S3 placeholder save fails', async () => {
        state.s3KeyFails = true
        const result = await create(10 * MB)
        expect(result).toEqual({ mode: 'DB' })
    })
})
