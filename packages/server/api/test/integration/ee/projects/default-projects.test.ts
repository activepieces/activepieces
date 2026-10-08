import { apId, ErrorCode } from '@activepieces/core-utils'
import { PrincipalType, ProjectType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { generateMockToken } from '../../../helpers/auth'
import { createMockApiKey, createMockProject, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Default projects', () => {
    it('stores team projects of the platform as default projects', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        const secondProject = await saveProject({ platformId: mockPlatform.id, ownerId: mockOwner.id, type: ProjectType.TEAM })

        const response = await updateDefaultProjects({
            platformId: mockPlatform.id,
            userId: mockOwner.id,
            defaultProjectIds: [mockProject.id, secondProject.id, mockProject.id],
        })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response?.json().defaultProjectIds).toStrictEqual([mockProject.id, secondProject.id])
    })

    it('empties the list', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        await databaseConnection().getRepository('platform').update({ id: mockPlatform.id }, { defaultProjectIds: [mockProject.id] })

        const response = await updateDefaultProjects({ platformId: mockPlatform.id, userId: mockOwner.id, defaultProjectIds: [] })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response?.json().defaultProjectIds).toStrictEqual([])
    })

    it('refuses a personal project', async () => {
        const { mockPlatform, mockOwner } = await setupPlatform({ projectRolesEnabled: true })
        const personalProject = await saveProject({ platformId: mockPlatform.id, ownerId: mockOwner.id, type: ProjectType.PERSONAL })

        const response = await updateDefaultProjects({ platformId: mockPlatform.id, userId: mockOwner.id, defaultProjectIds: [personalProject.id] })

        expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response?.json().code).toBe(ErrorCode.VALIDATION)
    })

    it('refuses a project of another platform', async () => {
        const { mockPlatform, mockOwner } = await setupPlatform({ projectRolesEnabled: true })
        const { mockProject: otherPlatformProject } = await setupPlatform({ projectRolesEnabled: true })

        const response = await updateDefaultProjects({ platformId: mockPlatform.id, userId: mockOwner.id, defaultProjectIds: [otherPlatformProject.id] })

        expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response?.json().code).toBe(ErrorCode.VALIDATION)
    })

    it('refuses an unknown project', async () => {
        const { mockPlatform, mockOwner } = await setupPlatform({ projectRolesEnabled: true })

        const response = await updateDefaultProjects({ platformId: mockPlatform.id, userId: mockOwner.id, defaultProjectIds: ['unknown-project-id'] })

        expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response?.json().code).toBe(ErrorCode.VALIDATION)
    })

    it('refuses default projects on a plan without project roles', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: false })

        const response = await updateDefaultProjects({ platformId: mockPlatform.id, userId: mockOwner.id, defaultProjectIds: [mockProject.id] })

        expect(response?.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect(response?.json().code).toBe(ErrorCode.FEATURE_DISABLED)
    })

    it('empties the list, even while personal projects are off', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        await setPlatformState({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id], autoCreatePersonalProjects: false })

        const response = await updateDefaultProjects({ platformId: mockPlatform.id, userId: mockOwner.id, defaultProjectIds: [] })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response?.json().defaultProjectIds).toStrictEqual([])
    })

    it('drops a deleted project from the list', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        const deletedProject = await saveProject({ platformId: mockPlatform.id, ownerId: mockOwner.id, type: ProjectType.TEAM })
        await databaseConnection().getRepository('platform').update({ id: mockPlatform.id }, { defaultProjectIds: [mockProject.id, deletedProject.id] })
        const token = await generateMockToken({ id: mockOwner.id, type: PrincipalType.USER, platform: { id: mockPlatform.id } })

        const response = await app?.inject({
            method: 'DELETE',
            url: `/api/v1/projects/${deletedProject.id}`,
            headers: { authorization: `Bearer ${token}` },
        })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        const platform = await databaseConnection().getRepository('platform').findOneByOrFail({ id: mockPlatform.id })
        expect(platform.defaultProjectIds).toStrictEqual([mockProject.id])
    })

    it('deletes the last default project, even while personal projects are off', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        await setPlatformState({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id], autoCreatePersonalProjects: false })

        const response = await deleteProject({ platformId: mockPlatform.id, userId: mockOwner.id, projectId: mockProject.id })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        const platform = await databaseConnection().getRepository('platform').findOneByOrFail({ id: mockPlatform.id })
        expect(platform.defaultProjectIds).toStrictEqual([])
    })

    it('drops a project from the list when SCIM deletes its group', async () => {
        const { mockPlatform } = await mockAndSaveBasicSetup({ plan: { projectRolesEnabled: true, scimEnabled: true } })
        const apiKey = createMockApiKey({ platformId: mockPlatform.id })
        await databaseConnection().getRepository('api_key').save(apiKey)
        const group = await app?.inject({
            method: 'POST',
            url: '/api/v1/scim/v2/Groups',
            headers: { authorization: `Bearer ${apiKey.value}` },
            body: { schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'], displayName: 'Sales', externalId: apId(), members: [] },
        })
        await databaseConnection().getRepository('platform').update({ id: mockPlatform.id }, { defaultProjectIds: [group?.json().id] })

        const response = await app?.inject({ method: 'DELETE', url: `/api/v1/scim/v2/Groups/${group?.json().id}`, headers: { authorization: `Bearer ${apiKey.value}` } })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        const platform = await databaseConnection().getRepository('platform').findOneByOrFail({ id: mockPlatform.id })
        expect(platform.defaultProjectIds).toStrictEqual([])
    })
})

async function setupPlatform({ projectRolesEnabled }: { projectRolesEnabled: boolean }) {
    return mockAndSaveBasicSetup({
        plan: { projectRolesEnabled },
        project: { type: ProjectType.TEAM },
    })
}

async function saveProject({ platformId, ownerId, type }: { platformId: string, ownerId: string, type: ProjectType }) {
    const project = createMockProject({ platformId, ownerId, type })
    await databaseConnection().getRepository('project').save(project)
    return project
}

async function updateDefaultProjects({ platformId, userId, defaultProjectIds }: { platformId: string, userId: string, defaultProjectIds: string[] }) {
    const token = await generateMockToken({ id: userId, type: PrincipalType.USER, platform: { id: platformId } })
    return app?.inject({
        method: 'POST',
        url: `/api/v1/platforms/${platformId}`,
        headers: { authorization: `Bearer ${token}` },
        body: { defaultProjectIds },
    })
}

async function setPlatformState({ platformId, defaultProjectIds, autoCreatePersonalProjects }: { platformId: string, defaultProjectIds: string[], autoCreatePersonalProjects: boolean }) {
    await databaseConnection().getRepository('platform').update({ id: platformId }, { defaultProjectIds, autoCreatePersonalProjects })
}

async function deleteProject({ platformId, userId, projectId }: { platformId: string, userId: string, projectId: string }) {
    const token = await generateMockToken({ id: userId, type: PrincipalType.USER, platform: { id: platformId } })
    return app?.inject({
        method: 'DELETE',
        url: `/api/v1/projects/${projectId}`,
        headers: { authorization: `Bearer ${token}` },
    })
}
