import { ErrorCode } from '@activepieces/core-utils'
import { PrincipalType, ProjectType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { generateMockToken } from '../../../helpers/auth'
import { createMockProject, mockAndSaveBasicSetup } from '../../../helpers/mocks'
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

    it('refuses emptying the list while personal projects are off', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        await databaseConnection().getRepository('platform').update({ id: mockPlatform.id }, { defaultProjectIds: [mockProject.id], autoCreatePersonalProjects: false })

        const response = await updateDefaultProjects({ platformId: mockPlatform.id, userId: mockOwner.id, defaultProjectIds: [] })

        expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response?.json().code).toBe(ErrorCode.DEFAULT_PROJECT_REQUIRED)
    })

    it('allows removing one of several defaults while personal projects are off', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        const secondProject = await saveProject({ platformId: mockPlatform.id, ownerId: mockOwner.id, type: ProjectType.TEAM })
        await databaseConnection().getRepository('platform').update({ id: mockPlatform.id }, { defaultProjectIds: [mockProject.id, secondProject.id], autoCreatePersonalProjects: false })

        const response = await updateDefaultProjects({ platformId: mockPlatform.id, userId: mockOwner.id, defaultProjectIds: [mockProject.id] })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response?.json().defaultProjectIds).toStrictEqual([mockProject.id])
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
})

describe('The last default project stays while personal projects are off', () => {
    it('refuses deleting the last default project while personal projects are off', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        await setPlatformState({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id], autoCreatePersonalProjects: false })

        const response = await deleteProject({ platformId: mockPlatform.id, userId: mockOwner.id, projectId: mockProject.id })

        expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response?.json().code).toBe(ErrorCode.DEFAULT_PROJECT_REQUIRED)
        expect(await databaseConnection().getRepository('project').findOneBy({ id: mockProject.id })).not.toBeNull()
    })

    it('deletes one of several default projects while personal projects are off', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        const secondProject = await saveProject({ platformId: mockPlatform.id, ownerId: mockOwner.id, type: ProjectType.TEAM })
        await setPlatformState({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id, secondProject.id], autoCreatePersonalProjects: false })

        const response = await deleteProject({ platformId: mockPlatform.id, userId: mockOwner.id, projectId: secondProject.id })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
    })

    it('deletes the last default project after a downgrade, even with personal projects saved off', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: false })
        await setPlatformState({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id], autoCreatePersonalProjects: false })

        const response = await deleteProject({ platformId: mockPlatform.id, userId: mockOwner.id, projectId: mockProject.id })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
    })

    it('deletes the last default project while personal projects are on', async () => {
        const { mockPlatform, mockOwner } = await setupPlatform({ projectRolesEnabled: true })
        const secondProject = await saveProject({ platformId: mockPlatform.id, ownerId: mockOwner.id, type: ProjectType.TEAM })
        await setPlatformState({ platformId: mockPlatform.id, defaultProjectIds: [secondProject.id], autoCreatePersonalProjects: true })

        const response = await deleteProject({ platformId: mockPlatform.id, userId: mockOwner.id, projectId: secondProject.id })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
    })
})

describe('Personal projects need a default project to land in', () => {
    it('refuses turning personal projects off while there are no default projects', async () => {
        const { mockPlatform, mockOwner } = await setupPlatform({ projectRolesEnabled: true })

        const response = await updatePlatform({ platformId: mockPlatform.id, userId: mockOwner.id, body: { autoCreatePersonalProjects: false } })

        expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response?.json().code).toBe(ErrorCode.DEFAULT_PROJECT_REQUIRED)
    })

    it('turns personal projects off when there is a default project', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        await setPlatformState({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id], autoCreatePersonalProjects: true })

        const response = await updatePlatform({ platformId: mockPlatform.id, userId: mockOwner.id, body: { autoCreatePersonalProjects: false } })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response?.json().autoCreatePersonalProjects).toBe(false)
    })

    it('always allows turning personal projects on', async () => {
        const { mockPlatform, mockOwner } = await setupPlatform({ projectRolesEnabled: true })
        await setPlatformState({ platformId: mockPlatform.id, defaultProjectIds: [], autoCreatePersonalProjects: false })

        const response = await updatePlatform({ platformId: mockPlatform.id, userId: mockOwner.id, body: { autoCreatePersonalProjects: true } })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response?.json().autoCreatePersonalProjects).toBe(true)
    })

    it('accepts an unchanged "off" sent back with other settings on a platform with no default projects', async () => {
        const { mockPlatform, mockOwner } = await setupPlatform({ projectRolesEnabled: true })
        await setPlatformState({ platformId: mockPlatform.id, defaultProjectIds: [], autoCreatePersonalProjects: false })

        const response = await updatePlatform({ platformId: mockPlatform.id, userId: mockOwner.id, body: { name: 'Renamed', autoCreatePersonalProjects: false } })

        expect(response?.statusCode).toBe(StatusCodes.OK)
    })

    it('still saves other settings on a platform that is already off with no default projects', async () => {
        const { mockPlatform, mockOwner } = await setupPlatform({ projectRolesEnabled: true })
        await setPlatformState({ platformId: mockPlatform.id, defaultProjectIds: [], autoCreatePersonalProjects: false })

        const response = await updatePlatform({ platformId: mockPlatform.id, userId: mockOwner.id, body: { name: 'Renamed' } })

        expect(response?.statusCode).toBe(StatusCodes.OK)
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

async function updatePlatform({ platformId, userId, body }: { platformId: string, userId: string, body: Record<string, unknown> }) {
    const token = await generateMockToken({ id: userId, type: PrincipalType.USER, platform: { id: platformId } })
    return app?.inject({
        method: 'POST',
        url: `/api/v1/platforms/${platformId}`,
        headers: { authorization: `Bearer ${token}` },
        body,
    })
}

async function deleteProject({ platformId, userId, projectId }: { platformId: string, userId: string, projectId: string }) {
    const token = await generateMockToken({ id: userId, type: PrincipalType.USER, platform: { id: platformId } })
    return app?.inject({
        method: 'DELETE',
        url: `/api/v1/projects/${projectId}`,
        headers: { authorization: `Bearer ${token}` },
    })
}
