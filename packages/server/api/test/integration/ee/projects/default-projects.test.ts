import { apId, ErrorCode, Permission, RoleType } from '@activepieces/core-utils'
import { PlatformRole, PrincipalType, ProjectType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { In, ObjectLiteral } from 'typeorm'
import { SoftDeleteQueryBuilder } from 'typeorm/query-builder/SoftDeleteQueryBuilder.js'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { generateMockToken } from '../../../helpers/auth'
import { createMockApiKey, createMockProject, createMockProjectMember, createMockProjectRole, createMockUser, createMockUserIdentity, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Default projects', () => {
    it('marks team projects as defaults, and the platform lists them oldest first', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        const secondProject = await saveProject({ platformId: mockPlatform.id, ownerId: mockOwner.id, type: ProjectType.TEAM })
        await databaseConnection().getRepository('project').update({ id: mockProject.id }, { created: '2026-01-01T00:00:00.000Z' })
        await databaseConnection().getRepository('project').update({ id: secondProject.id }, { created: '2026-02-01T00:00:00.000Z' })

        const secondResponse = await setDefault({ platformId: mockPlatform.id, userId: mockOwner.id, projectId: secondProject.id, isDefault: true })
        const firstResponse = await setDefault({ platformId: mockPlatform.id, userId: mockOwner.id, projectId: mockProject.id, isDefault: true })

        expect(secondResponse?.statusCode).toBe(StatusCodes.OK)
        expect(firstResponse?.statusCode).toBe(StatusCodes.OK)
        expect(firstResponse?.json().isDefault).toBe(true)
        expect((await getPlatform({ platformId: mockPlatform.id, userId: mockOwner.id }))?.json().defaultProjectIds).toStrictEqual([mockProject.id, secondProject.id])
    })

    it('removes a project from the defaults', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        await markDefault({ projectIds: [mockProject.id] })

        const response = await setDefault({ platformId: mockPlatform.id, userId: mockOwner.id, projectId: mockProject.id, isDefault: false })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(await defaultProjectIdsOf({ platformId: mockPlatform.id })).toStrictEqual([])
    })

    it('removes the last default, even while personal projects are off', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        await setPlatformState({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id], autoCreatePersonalProjects: false })

        const response = await setDefault({ platformId: mockPlatform.id, userId: mockOwner.id, projectId: mockProject.id, isDefault: false })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(await defaultProjectIdsOf({ platformId: mockPlatform.id })).toStrictEqual([])
    })

    it('never marks a personal project as a default', async () => {
        const { mockPlatform, mockOwner } = await setupPlatform({ projectRolesEnabled: true })
        const personalProject = await saveProject({ platformId: mockPlatform.id, ownerId: mockOwner.id, type: ProjectType.PERSONAL })

        await setDefault({ platformId: mockPlatform.id, userId: mockOwner.id, projectId: personalProject.id, isDefault: true })

        expect(await defaultProjectIdsOf({ platformId: mockPlatform.id })).toStrictEqual([])
    })

    it('does not mark a project of another platform', async () => {
        const { mockPlatform, mockOwner } = await setupPlatform({ projectRolesEnabled: true })
        const { mockPlatform: otherPlatform, mockProject: otherPlatformProject } = await setupPlatform({ projectRolesEnabled: true })

        const response = await setDefault({ platformId: mockPlatform.id, userId: mockOwner.id, projectId: otherPlatformProject.id, isDefault: true })

        expect(response?.statusCode).not.toBe(StatusCodes.OK)
        expect(await defaultProjectIdsOf({ platformId: otherPlatform.id })).toStrictEqual([])
    })

    it('does not mark a deleted project', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        await databaseConnection().getRepository('project').update({ id: mockProject.id }, { deleted: new Date().toISOString() })

        const response = await setDefault({ platformId: mockPlatform.id, userId: mockOwner.id, projectId: mockProject.id, isDefault: true })

        expect(response?.statusCode).not.toBe(StatusCodes.OK)
        expect(await defaultProjectIdsOf({ platformId: mockPlatform.id })).toStrictEqual([])
    })

    it('refuses default projects on a plan without project roles', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: false })

        const response = await setDefault({ platformId: mockPlatform.id, userId: mockOwner.id, projectId: mockProject.id, isDefault: true })

        expect(response?.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect(response?.json().code).toBe(ErrorCode.FEATURE_DISABLED)
        expect(await defaultProjectIdsOf({ platformId: mockPlatform.id })).toStrictEqual([])
    })

    it('ignores isDefault from a project admin who is not a platform admin', async () => {
        const { mockPlatform, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        const member = await saveProjectWriter({ platformId: mockPlatform.id, projectId: mockProject.id })

        const response = await setDefault({ platformId: mockPlatform.id, userId: member.id, projectId: mockProject.id, isDefault: true })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(await defaultProjectIdsOf({ platformId: mockPlatform.id })).toStrictEqual([])
    })

    it('keeps the default flag when another project setting is saved', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        await markDefault({ projectIds: [mockProject.id] })
        const token = await generateMockToken({ id: mockOwner.id, type: PrincipalType.USER, platform: { id: mockPlatform.id } })

        const response = await app?.inject({
            method: 'POST',
            url: `/api/v1/projects/${mockProject.id}`,
            headers: { authorization: `Bearer ${token}` },
            body: { displayName: 'Renamed' },
        })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(await defaultProjectIdsOf({ platformId: mockPlatform.id })).toStrictEqual([mockProject.id])
    })

    it('refuses to delete a default project from the app', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        await setPlatformState({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id], autoCreatePersonalProjects: true })

        const response = await deleteProject({ platformId: mockPlatform.id, userId: mockOwner.id, projectId: mockProject.id })

        expect(response?.json().code).toBe(ErrorCode.VALIDATION)
        expect(await isLive({ projectId: mockProject.id })).toBe(true)
        expect(await defaultProjectIdsOf({ platformId: mockPlatform.id })).toStrictEqual([mockProject.id])
    })

    it('refuses to delete a project another admin makes a default while the delete is running', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        const originalExecute = SoftDeleteQueryBuilder.prototype.execute
        let madeDefault = false
        const execute = vi.spyOn(SoftDeleteQueryBuilder.prototype, 'execute').mockImplementation(async function (this: SoftDeleteQueryBuilder<ObjectLiteral>) {
            if (!madeDefault && this.expressionMap.mainAlias?.metadata.tableName === 'project') {
                madeDefault = true
                await markDefault({ projectIds: [mockProject.id] })
            }
            return originalExecute.apply(this)
        })

        try {
            const response = await deleteProject({ platformId: mockPlatform.id, userId: mockOwner.id, projectId: mockProject.id })
            expect(response?.json().code).toBe(ErrorCode.VALIDATION)
        }
        finally {
            execute.mockRestore()
        }

        expect(madeDefault).toBe(true)
        expect(await isLive({ projectId: mockProject.id })).toBe(true)
        expect(await defaultProjectIdsOf({ platformId: mockPlatform.id })).toStrictEqual([mockProject.id])
    })

    it('deletes it from the app once it is no longer a default project', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        const otherDefault = await saveProject({ platformId: mockPlatform.id, ownerId: mockOwner.id, type: ProjectType.TEAM })
        await setPlatformState({ platformId: mockPlatform.id, defaultProjectIds: [otherDefault.id], autoCreatePersonalProjects: true })

        const response = await deleteProject({ platformId: mockPlatform.id, userId: mockOwner.id, projectId: mockProject.id })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        expect(await defaultProjectIdsOf({ platformId: mockPlatform.id })).toStrictEqual([otherDefault.id])
    })

    it('still deletes a default project with an API key, and drops it from the list', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        const deletedProject = await saveProject({ platformId: mockPlatform.id, ownerId: mockOwner.id, type: ProjectType.TEAM })
        await setPlatformState({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id, deletedProject.id], autoCreatePersonalProjects: false })
        const apiKey = createMockApiKey({ platformId: mockPlatform.id })
        await databaseConnection().getRepository('api_key').save(apiKey)

        const response = await app?.inject({
            method: 'DELETE',
            url: `/api/v1/projects/${deletedProject.id}`,
            headers: { authorization: `Bearer ${apiKey.value}` },
        })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        expect(await defaultProjectIdsOf({ platformId: mockPlatform.id })).toStrictEqual([mockProject.id])
    })

    it('still deletes a default project from the app on a plan without project roles, and drops it from the list', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: false })
        await setPlatformState({ platformId: mockPlatform.id, defaultProjectIds: [mockProject.id], autoCreatePersonalProjects: true })

        const response = await deleteProject({ platformId: mockPlatform.id, userId: mockOwner.id, projectId: mockProject.id })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        expect(await defaultProjectIdsOf({ platformId: mockPlatform.id })).toStrictEqual([])
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
        await markDefault({ projectIds: [group?.json().id] })

        const response = await app?.inject({ method: 'DELETE', url: `/api/v1/scim/v2/Groups/${group?.json().id}`, headers: { authorization: `Bearer ${apiKey.value}` } })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        expect(await defaultProjectIdsOf({ platformId: mockPlatform.id })).toStrictEqual([])
    })

    it('leaves out a soft-deleted default project', async () => {
        const { mockPlatform, mockOwner, mockProject } = await setupPlatform({ projectRolesEnabled: true })
        await markDefault({ projectIds: [mockProject.id] })
        await databaseConnection().getRepository('project').update({ id: mockProject.id }, { deleted: new Date().toISOString() })
        const token = await generateMockToken({ id: mockOwner.id, type: PrincipalType.USER, platform: { id: mockPlatform.id } })

        const response = await app?.inject({ method: 'GET', url: `/api/v1/platforms/${mockPlatform.id}`, headers: { authorization: `Bearer ${token}` } })

        expect(response?.json().defaultProjectIds).toStrictEqual([])
    })

    it('never lets a personal project be a default, even when written directly', async () => {
        const { mockPlatform, mockOwner } = await setupPlatform({ projectRolesEnabled: true })
        const personalProject = await saveProject({ platformId: mockPlatform.id, ownerId: mockOwner.id, type: ProjectType.PERSONAL })

        await expect(markDefault({ projectIds: [personalProject.id] })).rejects.toThrow()
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

async function setDefault({ platformId, userId, projectId, isDefault }: { platformId: string, userId: string, projectId: string, isDefault: boolean }) {
    const token = await generateMockToken({ id: userId, type: PrincipalType.USER, platform: { id: platformId } })
    return app?.inject({
        method: 'POST',
        url: `/api/v1/projects/${projectId}`,
        headers: { authorization: `Bearer ${token}` },
        body: { isDefault },
    })
}

async function getPlatform({ platformId, userId }: { platformId: string, userId: string }) {
    const token = await generateMockToken({ id: userId, type: PrincipalType.USER, platform: { id: platformId } })
    return app?.inject({ method: 'GET', url: `/api/v1/platforms/${platformId}`, headers: { authorization: `Bearer ${token}` } })
}

async function saveProjectWriter({ platformId, projectId }: { platformId: string, projectId: string }) {
    const identity = createMockUserIdentity({ verified: true })
    await databaseConnection().getRepository('user_identity').save(identity)
    const member = createMockUser({ identityId: identity.id, platformId, platformRole: PlatformRole.MEMBER })
    await databaseConnection().getRepository('user').save(member)
    const projectRole = createMockProjectRole({ platformId, type: RoleType.CUSTOM, permissions: [Permission.WRITE_PROJECT, Permission.READ_PROJECT] })
    await databaseConnection().getRepository('project_role').save(projectRole)
    await databaseConnection().getRepository('project_member').save(createMockProjectMember({ userId: member.id, projectId, platformId, projectRoleId: projectRole.id }))
    return member
}

async function setPlatformState({ platformId, defaultProjectIds, autoCreatePersonalProjects }: { platformId: string, defaultProjectIds: string[], autoCreatePersonalProjects: boolean }) {
    await databaseConnection().getRepository('platform').update({ id: platformId }, { autoCreatePersonalProjects })
    await markDefault({ projectIds: defaultProjectIds })
}

async function markDefault({ projectIds }: { projectIds: string[] }) {
    if (projectIds.length === 0) {
        return
    }
    await databaseConnection().getRepository('project').update({ id: In(projectIds) }, { isDefault: true })
}

async function deleteProject({ platformId, userId, projectId }: { platformId: string, userId: string, projectId: string }) {
    const token = await generateMockToken({ id: userId, type: PrincipalType.USER, platform: { id: platformId } })
    return app?.inject({
        method: 'DELETE',
        url: `/api/v1/projects/${projectId}`,
        headers: { authorization: `Bearer ${token}` },
    })
}

async function defaultProjectIdsOf({ platformId }: { platformId: string }) {
    const projects = await databaseConnection().getRepository('project').find({
        where: { platformId, isDefault: true },
        order: { created: 'ASC' },
    })
    return projects.map((project) => project.id)
}

async function isLive({ projectId }: { projectId: string }) {
    const project = await databaseConnection().getRepository('project').findOneBy({ id: projectId })
    return project !== null && project.deleted === null
}
