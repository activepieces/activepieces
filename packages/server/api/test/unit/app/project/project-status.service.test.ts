import { ProjectStatus, RunEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockStoreGet, mockStorePut, mockStoreDelete, mockFindOne } = vi.hoisted(() => ({
    mockStoreGet: vi.fn(),
    mockStorePut: vi.fn(),
    mockStoreDelete: vi.fn(),
    mockFindOne: vi.fn(),
}))

vi.mock('../../../../src/app/database/redis-connections', () => ({
    distributedStore: {
        get: mockStoreGet,
        put: mockStorePut,
        delete: mockStoreDelete,
    },
}))

vi.mock('../../../../src/app/project/project-repo', () => ({
    projectRepo: () => ({ findOne: mockFindOne }),
}))

const mockLog: FastifyBaseLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(),
    silent: vi.fn(),
    level: 'info',
} as unknown as FastifyBaseLogger

const PROJECT_ID = 'proj-1'

async function service() {
    const { projectStatusService } = await import('../../../../src/app/project/project-status.service')
    return projectStatusService(mockLog)
}

describe('projectStatusService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockStoreGet.mockResolvedValue(null)
        mockStorePut.mockResolvedValue(undefined)
    })

    it('reads the status from the DB and caches it when there is no cache entry', async () => {
        mockFindOne.mockResolvedValue({ status: ProjectStatus.INACTIVE })

        expect(await (await service()).isInactive({ projectId: PROJECT_ID })).toBe(true)
        expect(mockStorePut).toHaveBeenCalledWith(`project:v1:${PROJECT_ID}:status`, ProjectStatus.INACTIVE, 60)
    })

    it('serves a cached INACTIVE without touching the DB', async () => {
        mockStoreGet.mockResolvedValue(ProjectStatus.INACTIVE)

        expect(await (await service()).isInactive({ projectId: PROJECT_ID })).toBe(true)
        expect(mockFindOne).not.toHaveBeenCalled()
    })

    it('treats a missing project as active', async () => {
        mockFindOne.mockResolvedValue(null)

        expect(await (await service()).isInactive({ projectId: PROJECT_ID })).toBe(false)
    })

    it('fails open when the store throws', async () => {
        mockStoreGet.mockRejectedValue(new Error('redis down'))

        expect(await (await service()).isInactive({ projectId: PROJECT_ID })).toBe(false)
    })

    it('treats a nil projectId as active', async () => {
        expect(await (await service()).isInactive({ projectId: null })).toBe(false)
        expect(mockStoreGet).not.toHaveBeenCalled()
    })

    it('never blocks a TESTING run, even while the project is inactive', async () => {
        mockFindOne.mockResolvedValue({ status: ProjectStatus.INACTIVE })

        const blocked = await (await service()).shouldBlockRun({
            projectId: PROJECT_ID,
            environment: RunEnvironment.TESTING,
        })

        expect(blocked).toBe(false)
        expect(mockStoreGet).not.toHaveBeenCalled()
    })

    it('blocks a PRODUCTION run while the project is inactive', async () => {
        mockFindOne.mockResolvedValue({ status: ProjectStatus.INACTIVE })

        const blocked = await (await service()).shouldBlockRun({
            projectId: PROJECT_ID,
            environment: RunEnvironment.PRODUCTION,
        })

        expect(blocked).toBe(true)
    })

    it('assertRunIsAllowed throws PROJECT_IS_INACTIVE for a blocked production run', async () => {
        mockFindOne.mockResolvedValue({ status: ProjectStatus.INACTIVE })

        await expect(
            (await service()).assertRunIsAllowed({ projectId: PROJECT_ID, environment: RunEnvironment.PRODUCTION }),
        ).rejects.toMatchObject({ error: { code: 'PROJECT_IS_INACTIVE' } })
    })

    it('assertRunIsAllowed stays silent for a testing run', async () => {
        mockFindOne.mockResolvedValue({ status: ProjectStatus.INACTIVE })

        await expect(
            (await service()).assertRunIsAllowed({ projectId: PROJECT_ID, environment: RunEnvironment.TESTING }),
        ).resolves.toBeUndefined()
    })
})
