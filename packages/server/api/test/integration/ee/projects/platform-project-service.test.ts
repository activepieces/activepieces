import { apId } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { platformProjectService } from '../../../../src/app/ee/projects/platform-project-service'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
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
