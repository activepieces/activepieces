import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindOneBy = vi.fn()
const mockRepoDelete = vi.fn()
const mockDeleteFiles = vi.fn()

vi.mock('../../../../src/app/file/file.entity', () => ({
    FileEntity: {},
}))

vi.mock('../../../../src/app/core/db/repo-factory', () => ({
    repoFactory: vi.fn(() => () => ({
        findOneBy: mockFindOneBy,
        delete: mockRepoDelete,
        save: vi.fn(),
        find: vi.fn(),
    })),
}))

vi.mock('../../../../src/app/helper/system/system', () => ({
    system: {
        getOrThrow: vi.fn().mockReturnValue('DB'),
        getNumberOrThrow: vi.fn().mockReturnValue(30),
        get: vi.fn().mockReturnValue(undefined),
    },
}))

vi.mock('../../../../src/app/helper/exception-handler', () => ({
    exceptionHandler: { handle: vi.fn() },
}))

vi.mock('../../../../src/app/file/s3-helper', () => ({
    s3Helper: vi.fn(() => ({
        deleteFiles: mockDeleteFiles,
        uploadFile: vi.fn(),
        constructS3Key: vi.fn(),
    })),
}))

vi.mock('../../../../src/app/file/file-compressor', () => ({
    fileCompressor: {
        compress: vi.fn(),
        decompress: vi.fn(),
    },
}))

import { fileService } from '../../../../src/app/file/file.service'

const mockLog = {
    info: vi.fn(), debug: vi.fn(), error: vi.fn(), warn: vi.fn(),
    child: vi.fn(), fatal: vi.fn(), trace: vi.fn(), silent: vi.fn(), level: 'info',
} as any

describe('fileService.delete', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should delete a DB-stored file', async () => {
        mockFindOneBy.mockResolvedValue({ id: 'file-1', projectId: 'proj-1', s3Key: null })
        mockRepoDelete.mockResolvedValue({ affected: 1 })

        await fileService(mockLog).delete({ projectId: 'proj-1', fileId: 'file-1' })

        expect(mockRepoDelete).toHaveBeenCalledWith({ id: 'file-1' })
        expect(mockDeleteFiles).not.toHaveBeenCalled()
    })

    it('should delete an S3-stored file and its S3 object', async () => {
        mockFindOneBy.mockResolvedValue({ id: 'file-2', projectId: 'proj-1', s3Key: 'some/s3/key' })
        mockRepoDelete.mockResolvedValue({ affected: 1 })

        await fileService(mockLog).delete({ projectId: 'proj-1', fileId: 'file-2' })

        expect(mockDeleteFiles).toHaveBeenCalledWith(['some/s3/key'])
        expect(mockRepoDelete).toHaveBeenCalledWith({ id: 'file-2' })
    })

    it('should do nothing when file does not exist', async () => {
        mockFindOneBy.mockResolvedValue(null)

        await fileService(mockLog).delete({ projectId: 'proj-1', fileId: 'file-missing' })

        expect(mockRepoDelete).not.toHaveBeenCalled()
        expect(mockDeleteFiles).not.toHaveBeenCalled()
    })
})
