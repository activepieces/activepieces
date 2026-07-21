import { FileCompression, FileLocation, FileType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { In } from 'typeorm'
import { fileRepo, fileService } from '../../../../src/app/file/file.service'
import { db } from '../../../helpers/db'
import { createMockFile, createMockProject, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    process.env.AP_PAUSED_FLOW_TIMEOUT_DAYS = '5'
    app = await setupTestEnvironment()
})

afterAll(async () => {
    delete process.env.AP_PAUSED_FLOW_TIMEOUT_DAYS
    await teardownTestEnvironment()
})

const daysAgo = (days: number): string => dayjs().subtract(days, 'days').toISOString()

const saveLogFile = async ({ projectId, platformId, created }: { projectId: string | null, platformId: string, created: string }): Promise<string> => {
    const file = createMockFile({
        projectId,
        platformId,
        created,
        type: FileType.FLOW_RUN_LOG,
        location: FileLocation.DB,
        compression: FileCompression.NONE,
    })
    await db.save('file', file)
    return file.id
}

describe('fileService.deleteStaleBulk', () => {
    it('applies shorter per-project retention and treats the instance value as a ceiling', async () => {
        const { mockOwner, mockPlatform, mockProject: defaultProject } = await mockAndSaveBasicSetup()

        const shortRetentionProject = createMockProject({
            ownerId: mockOwner.id,
            platformId: mockPlatform.id,
            executionDataRetentionDays: 7,
        })
        const aboveCeilingProject = createMockProject({
            ownerId: mockOwner.id,
            platformId: mockPlatform.id,
            executionDataRetentionDays: 60,
        })
        const belowFloorProject = createMockProject({
            ownerId: mockOwner.id,
            platformId: mockPlatform.id,
            executionDataRetentionDays: 3,
        })
        await db.save('project', [shortRetentionProject, aboveCeilingProject, belowFloorProject])

        const defaultProjectStale = await saveLogFile({ projectId: defaultProject.id, platformId: mockPlatform.id, created: daysAgo(40) })
        const defaultProjectFresh = await saveLogFile({ projectId: defaultProject.id, platformId: mockPlatform.id, created: daysAgo(10) })
        const shortProjectStale = await saveLogFile({ projectId: shortRetentionProject.id, platformId: mockPlatform.id, created: daysAgo(10) })
        const shortProjectFresh = await saveLogFile({ projectId: shortRetentionProject.id, platformId: mockPlatform.id, created: daysAgo(3) })
        const aboveCeilingStale = await saveLogFile({ projectId: aboveCeilingProject.id, platformId: mockPlatform.id, created: daysAgo(40) })
        const aboveCeilingFresh = await saveLogFile({ projectId: aboveCeilingProject.id, platformId: mockPlatform.id, created: daysAgo(10) })
        const belowFloorStale = await saveLogFile({ projectId: belowFloorProject.id, platformId: mockPlatform.id, created: daysAgo(10) })
        const belowFloorClamped = await saveLogFile({ projectId: belowFloorProject.id, platformId: mockPlatform.id, created: daysAgo(4) })
        const orphanStale = await saveLogFile({ projectId: null, platformId: mockPlatform.id, created: daysAgo(40) })
        const orphanFresh = await saveLogFile({ projectId: null, platformId: mockPlatform.id, created: daysAgo(10) })

        await fileService(app!.log).deleteStaleBulk([FileType.FLOW_RUN_LOG])

        const allIds = [
            defaultProjectStale,
            defaultProjectFresh,
            shortProjectStale,
            shortProjectFresh,
            aboveCeilingStale,
            aboveCeilingFresh,
            belowFloorStale,
            belowFloorClamped,
            orphanStale,
            orphanFresh,
        ]
        const survivingFiles = await fileRepo().findBy({ id: In(allIds) })
        const survivingIds = survivingFiles.map(file => file.id).sort()

        expect(survivingIds).toEqual([
            defaultProjectFresh,
            shortProjectFresh,
            aboveCeilingFresh,
            belowFloorClamped,
            orphanFresh,
        ].sort())
    })
})
