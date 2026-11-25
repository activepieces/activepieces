import { apId } from '@activepieces/core-utils'
import { AppConnection } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { platformProjectBackgroundJobs } from '../../../../src/app/ee/projects/platform-project-jobs'
import { platformProjectService } from '../../../../src/app/ee/projects/platform-project-service'
import * as systemJobModule from '../../../../src/app/helper/system-jobs/system-job'
import { db } from '../../../helpers/db'
import { createMockConnection, createMockProject, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('markForDeletion', () => {
    it('refuses a project id that does not exist', async () => {
        const { mockPlatform } = await mockAndSaveBasicSetup()

        await expect(platformProjectService(app.log).markForDeletion({
            id: apId(),
            platformId: mockPlatform.id,
        })).rejects.toThrow()
    })

    it('refuses a project that belongs to another platform', async () => {
        const owner = await mockAndSaveBasicSetup()
        const stranger = await mockAndSaveBasicSetup()

        await expect(platformProjectService(app.log).markForDeletion({
            id: owner.mockProject.id,
            platformId: stranger.mockPlatform.id,
        })).rejects.toThrow()
    })

    it('soft deletes a project of its own platform', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()

        await expect(platformProjectService(app.log).markForDeletion({
            id: mockProject.id,
            platformId: mockPlatform.id,
        })).resolves.toBeUndefined()
    })
})

describe('hardDeleteProjectHandler', () => {
    it('deletes the project\'s own connections and only unshares the ones other projects still use', async () => {
        const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup()
        const deleted = createMockProject({ platformId: mockPlatform.id, ownerId: mockOwner.id })
        await db.save('project', deleted)
        const own = createMockConnection({ platformId: mockPlatform.id, projectIds: [deleted.id] }, mockOwner.id)
        const shared = createMockConnection({ platformId: mockPlatform.id, projectIds: [mockProject.id, deleted.id] }, mockOwner.id)
        await db.save('app_connection', [own, shared])
        const originalSystemJobsSchedule = systemJobModule.systemJobsSchedule
        vi.spyOn(systemJobModule, 'systemJobsSchedule').mockImplementation((log) => ({
            ...originalSystemJobsSchedule(log),
            getJob: vi.fn().mockResolvedValue({ updateData: vi.fn() }),
        }))

        await platformProjectBackgroundJobs(app.log).hardDeleteProjectHandler({ projectId: deleted.id, platformId: mockPlatform.id, preDeletedFlowIds: [] })

        expect(await db.findOneBy('app_connection', { id: own.id })).toBeNull()
        expect((await db.findOneByOrFail<AppConnection>('app_connection', { id: shared.id })).projectIds).toStrictEqual([mockProject.id])
    })
})
