import { apId, spreadIfDefined } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
import { PlatformRole, PrincipalType, ProjectType, UserIdentityProvider, UserStatus } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { In, ObjectLiteral, Repository } from 'typeorm'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { projectEnterpriseHooks } from '../../../../src/app/ee/projects/ee-project-hooks'
import { personalProjectsService } from '../../../../src/app/ee/projects/personal-projects/personal-projects.service'
import { SystemJobData, SystemJobName } from '../../../../src/app/helper/system-jobs/common'
import { systemJobsSchedule } from '../../../../src/app/helper/system-jobs/system-job'
import { projectHooks } from '../../../../src/app/project/project-hooks'
import { generateMockToken } from '../../../helpers/auth'
import { createMockProject, mockAndSaveBasicSetup, mockBasicUser } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app!.log!
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Personal projects summary', () => {
    it('counts personal projects and the active members without one', async () => {
        const { platformId, ownerToken } = await setupPlatform({ projectRolesEnabled: true, autoCreatePersonalProjects: false })
        const withProject = await saveUser({ platformId })
        await savePersonalProject({ platformId, ownerId: withProject.id })
        await saveUser({ platformId })
        await saveUser({ platformId, status: UserStatus.INACTIVE })
        await saveUser({ platformId, provider: UserIdentityProvider.JWT })

        const response = await getSummary({ token: ownerToken })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response?.json()).toStrictEqual({ personalProjectCount: 1, membersWithoutPersonalProject: 2 })
    })

    it('does not count a deleted personal project', async () => {
        const { platformId, ownerToken } = await setupPlatform({ projectRolesEnabled: true, autoCreatePersonalProjects: false })
        const member = await saveUser({ platformId })
        await savePersonalProject({ platformId, ownerId: member.id, deleted: new Date().toISOString() })

        const response = await getSummary({ token: ownerToken })

        expect(response?.json()).toStrictEqual({ personalProjectCount: 0, membersWithoutPersonalProject: 2 })
    })

    it('is refused on a plan without project roles', async () => {
        const { ownerToken } = await setupPlatform({ projectRolesEnabled: false, autoCreatePersonalProjects: true })

        const response = await getSummary({ token: ownerToken })

        expect(response?.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
    })

    it('is refused to a member who is not a platform admin', async () => {
        const { platformId } = await setupPlatform({ projectRolesEnabled: true, autoCreatePersonalProjects: true })
        const member = await saveUser({ platformId })
        const memberToken = await generateMockToken({ id: member.id, type: PrincipalType.USER, platform: { id: platformId } })

        const response = await getSummary({ token: memberToken })

        expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
    })
})

describe('Creating personal projects for existing members', () => {
    it('is accepted when personal projects are on', async () => {
        const { ownerToken } = await setupPlatform({ projectRolesEnabled: true, autoCreatePersonalProjects: true })

        const response = await createMissing({ token: ownerToken })

        expect(response?.statusCode).toBe(StatusCodes.ACCEPTED)
    })

    it('turns personal projects on when they are off', async () => {
        const { platformId, ownerToken } = await setupPlatform({ projectRolesEnabled: true, autoCreatePersonalProjects: false })

        const response = await createMissing({ token: ownerToken })

        expect(response?.statusCode).toBe(StatusCodes.ACCEPTED)
        const platform = await databaseConnection().getRepository('platform').findOneByOrFail({ id: platformId })
        expect(platform.autoCreatePersonalProjects).toBe(true)
    })

    it('creates nothing when personal projects were turned off before the job ran', async () => {
        const { platformId } = await setupPlatform({ projectRolesEnabled: true, autoCreatePersonalProjects: false })
        const member = await saveUser({ platformId })

        await personalProjectsService(mockLog).createMissingHandler(await queueRun({ platformId }))

        expect(await personalProjectCountOf({ ownerId: member.id })).toBe(0)
    })

    it('works through more members than one batch', async () => {
        const { platformId } = await setupPlatform({ projectRolesEnabled: true, autoCreatePersonalProjects: true })
        const members = await Promise.all(Array.from({ length: 55 }, () => saveUser({ platformId })))

        await personalProjectsService(mockLog).createMissingHandler(await queueRun({ platformId }))

        const counts = await Promise.all(members.map((member) => personalProjectCountOf({ ownerId: member.id })))
        expect(counts.every((count) => count === 1)).toBe(true)
    })

    it('is refused on a plan without project roles', async () => {
        const { ownerToken } = await setupPlatform({ projectRolesEnabled: false, autoCreatePersonalProjects: true })

        const response = await createMissing({ token: ownerToken })

        expect(response?.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
    })

    it('creates one for each active member without one, and skips embedded and deactivated users', async () => {
        const { platformId, ownerId } = await setupPlatform({ projectRolesEnabled: true, autoCreatePersonalProjects: true })
        const withProject = await saveUser({ platformId })
        await savePersonalProject({ platformId, ownerId: withProject.id })
        const without = await saveUser({ platformId })
        const operator = await saveUser({ platformId, platformRole: PlatformRole.OPERATOR })
        const deactivated = await saveUser({ platformId, status: UserStatus.INACTIVE })
        const embedded = await saveUser({ platformId, provider: UserIdentityProvider.JWT })

        await personalProjectsService(mockLog).createMissingHandler(await queueRun({ platformId }))

        expect(await personalProjectCountOf({ ownerId: withProject.id })).toBe(1)
        expect(await personalProjectCountOf({ ownerId: without.id })).toBe(1)
        expect(await personalProjectCountOf({ ownerId: operator.id })).toBe(1)
        expect(await personalProjectCountOf({ ownerId })).toBe(1)
        expect(await personalProjectCountOf({ ownerId: deactivated.id })).toBe(0)
        expect(await personalProjectCountOf({ ownerId: embedded.id })).toBe(0)
    })

    it('creates the rest when a member fails, then fails the attempt with only that member saved for the retry', async () => {
        const { platformId } = await setupPlatform({ projectRolesEnabled: true, autoCreatePersonalProjects: true })
        const members = await Promise.all(Array.from({ length: 3 }, () => saveUser({ platformId })))
        const [failing, ...others] = members
        projectHooks.set((log) => ({
            postCreate: async (project, context) => {
                if (project.ownerId === failing.id) {
                    throw new Error('post-create failed')
                }
                await projectEnterpriseHooks(log).postCreate(project, context)
            },
        }))

        const run = await queueRun({ platformId })
        try {
            await expect(personalProjectsService(mockLog).createMissingHandler(run)).rejects.toThrow()
        }
        finally {
            projectHooks.set(projectEnterpriseHooks)
        }

        expect(await personalProjectCountOf({ ownerId: failing.id })).toBe(0)
        const counts = await Promise.all(others.map((member) => personalProjectCountOf({ ownerId: member.id })))
        expect(counts).toStrictEqual([1, 1])
        expect(await savedDataOf(run)).toStrictEqual({ platformId, runId: run.runId, onlyUserIds: [failing.id] })
    })

    it('a retry creates the failed member\'s project', async () => {
        const { platformId } = await setupPlatform({ projectRolesEnabled: true, autoCreatePersonalProjects: true })
        const member = await saveUser({ platformId })

        await personalProjectsService(mockLog).createMissingHandler(await queueRun({ platformId, onlyUserIds: [member.id] }))

        expect(await personalProjectCountOf({ ownerId: member.id })).toBe(1)
    })

    it('a retry only touches the members that failed, so a project deleted since stays deleted', async () => {
        const { platformId } = await setupPlatform({ projectRolesEnabled: true, autoCreatePersonalProjects: true })
        const failed = await saveUser({ platformId })
        const other = await saveUser({ platformId })

        await personalProjectsService(mockLog).createMissingHandler(await queueRun({ platformId, onlyUserIds: [failed.id] }))

        expect(await personalProjectCountOf({ ownerId: failed.id })).toBe(1)
        expect(await personalProjectCountOf({ ownerId: other.id })).toBe(0)
    })

    it('a retry handles more failed members than a query can take as parameters', async () => {
        const { platformId } = await setupPlatform({ projectRolesEnabled: true, autoCreatePersonalProjects: true })
        const member = await saveUser({ platformId })
        const userIds = [...Array.from({ length: 70_000 }, () => apId()), member.id]

        await personalProjectsService(mockLog).createMissingHandler(await queueRun({ platformId, onlyUserIds: userIds }))

        expect(await personalProjectCountOf({ ownerId: member.id })).toBe(1)
    })

    it('a resumed run starts after the last member the stopped run reached', async () => {
        const { platformId } = await setupPlatform({ projectRolesEnabled: true, autoCreatePersonalProjects: true })
        const members = await Promise.all(Array.from({ length: 3 }, () => saveUser({ platformId })))
        const [reached, ...rest] = await databaseConnection().getRepository('user').find({ where: { id: In(members.map((member) => member.id)) }, order: { id: 'ASC' } })

        await personalProjectsService(mockLog).createMissingHandler(await queueRun({ platformId, afterUserId: reached.id }))

        expect(await personalProjectCountOf({ ownerId: reached.id })).toBe(0)
        const counts = await Promise.all(rest.map((member) => personalProjectCountOf({ ownerId: member.id })))
        expect(counts).toStrictEqual([1, 1])
    })

    it('saves its progress after each batch, so a retry after a crash resumes from there', async () => {
        const { platformId } = await setupPlatform({ projectRolesEnabled: true, autoCreatePersonalProjects: true })
        await Promise.all(Array.from({ length: 51 }, () => saveUser({ platformId })))
        const ordered = await databaseConnection().getRepository('user').find({ where: { platformId }, order: { id: 'ASC' } })
        const run = await queueRun({ platformId })
        const originalCreateQueryBuilder = Repository.prototype.createQueryBuilder
        let userQueries = 0
        const createQueryBuilder = vi.spyOn(Repository.prototype, 'createQueryBuilder').mockImplementation(function (this: Repository<ObjectLiteral>, ...args: Parameters<Repository<ObjectLiteral>['createQueryBuilder']>) {
            if (this.metadata.tableName === 'user' && ++userQueries === 2) {
                throw new Error('database blip')
            }
            return originalCreateQueryBuilder.apply(this, args)
        })

        try {
            await expect(personalProjectsService(mockLog).createMissingHandler(run)).rejects.toThrow('database blip')
        }
        finally {
            createQueryBuilder.mockRestore()
        }

        const savedAfterUserId = (await savedDataOf(run))?.afterUserId
        const cursorIndex = ordered.findIndex((user) => user.id === savedAfterUserId)
        expect(cursorIndex).toBeGreaterThanOrEqual(0)
        const counts = await Promise.all(ordered.map((user) => personalProjectCountOf({ ownerId: user.id })))
        expect(counts.slice(0, cursorIndex + 1).every((count) => count === 1)).toBe(true)
        expect(counts.slice(cursorIndex + 1).every((count) => count === 0)).toBe(true)
        expect(counts.slice(cursorIndex + 1).length).toBeGreaterThan(0)
    })

    it('never creates a second one when it runs again', async () => {
        const { platformId } = await setupPlatform({ projectRolesEnabled: true, autoCreatePersonalProjects: true })
        const member = await saveUser({ platformId })

        const runs = await Promise.all([queueRun({ platformId }), queueRun({ platformId })])
        await Promise.all(runs.map((run) => personalProjectsService(mockLog).createMissingHandler(run)))
        await personalProjectsService(mockLog).createMissingHandler(await queueRun({ platformId }))

        expect(await personalProjectCountOf({ ownerId: member.id })).toBe(1)
    })

    it('only touches its own platform', async () => {
        const first = await setupPlatform({ projectRolesEnabled: true, autoCreatePersonalProjects: true })
        const second = await setupPlatform({ projectRolesEnabled: true, autoCreatePersonalProjects: true })
        const otherMember = await saveUser({ platformId: second.platformId })

        await personalProjectsService(mockLog).createMissingHandler(await queueRun({ platformId: first.platformId }))

        expect(await personalProjectCountOf({ ownerId: otherMember.id })).toBe(0)
    })
})

async function queueRun({ platformId, afterUserId, onlyUserIds }: { platformId: string, afterUserId?: string, onlyUserIds?: string[] }): Promise<SystemJobData<SystemJobName.CREATE_MISSING_PERSONAL_PROJECTS>> {
    const data = { platformId, runId: apId(), ...spreadIfDefined('afterUserId', afterUserId), ...spreadIfDefined('onlyUserIds', onlyUserIds) }
    await systemJobsSchedule(mockLog).upsertJob({
        job: { name: SystemJobName.CREATE_MISSING_PERSONAL_PROJECTS, data, jobId: jobIdOf(data) },
        schedule: { type: 'one-time', date: apDayjs().add(1, 'day') },
    })
    return data
}

async function savedDataOf(run: { platformId: string, runId: string }) {
    const job = await systemJobsSchedule(mockLog).getJob<SystemJobName.CREATE_MISSING_PERSONAL_PROJECTS>(jobIdOf(run))
    return job?.data
}

function jobIdOf({ platformId, runId }: { platformId: string, runId: string }): string {
    return `create-missing-personal-projects-${platformId}-${runId}`
}

async function setupPlatform({ projectRolesEnabled, autoCreatePersonalProjects }: { projectRolesEnabled: boolean, autoCreatePersonalProjects: boolean }) {
    const { mockPlatform, mockOwner } = await mockAndSaveBasicSetup({
        plan: { projectRolesEnabled },
        platform: { autoCreatePersonalProjects },
        project: { type: ProjectType.TEAM },
    })
    const ownerToken = await generateMockToken({ id: mockOwner.id, type: PrincipalType.USER, platform: { id: mockPlatform.id } })
    return { platformId: mockPlatform.id, ownerId: mockOwner.id, ownerToken }
}

async function saveUser({ platformId, status = UserStatus.ACTIVE, provider = UserIdentityProvider.EMAIL, platformRole = PlatformRole.MEMBER }: { platformId: string, status?: UserStatus, provider?: UserIdentityProvider, platformRole?: PlatformRole }) {
    const { mockUser } = await mockBasicUser({ userIdentity: { provider }, user: { platformId, status, platformRole } })
    return mockUser
}

async function savePersonalProject({ platformId, ownerId, deleted }: { platformId: string, ownerId: string, deleted?: string }) {
    const project = createMockProject({ platformId, ownerId, type: ProjectType.PERSONAL })
    await databaseConnection().getRepository('project').save({ ...project, deleted: deleted ?? null })
}

async function personalProjectCountOf({ ownerId }: { ownerId: string }) {
    return databaseConnection().getRepository('project').countBy({ ownerId, type: ProjectType.PERSONAL })
}

async function getSummary({ token }: { token: string }) {
    return app?.inject({ method: 'GET', url: '/api/v1/personal-projects/summary', headers: { authorization: `Bearer ${token}` } })
}

async function createMissing({ token }: { token: string }) {
    return app?.inject({ method: 'POST', url: '/api/v1/personal-projects/create-missing', headers: { authorization: `Bearer ${token}` } })
}
