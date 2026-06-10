import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { GitBranchType, PlatformRole, PrincipalType } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import {
    createMockGitRepo,
    createMockProject,
    mockAndSaveBasicSetup,
    mockAndSaveBasicSetupWithApiKey,
    mockBasicUser,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})
describe('Git API', () => {
    describe('Create API', () => {
        it('should not allow create git repo for other projects', async () => {
            const { mockPlatform, mockProject } = await mockAndSaveBasicSetup({
                platform: {
                },
                plan: {
                    environmentsEnabled: true,
                },
            })

            const { mockUser: mockUser2 } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const mockProject2 = createMockProject({ platformId: mockPlatform.id, ownerId: mockUser2.id })
            await db.save('project', mockProject2)

            const request = {
                projectId: mockProject.id,
                remoteUrl: `git@${faker.internet.url()}`,
                sshPrivateKey: faker.hacker.noun(),
                branch: 'main',
                branchType: GitBranchType.PRODUCTION,
                slug: 'test-slug',
            }

            const token = await generateMockToken({
                id: mockUser2.id,
                platform: {
                    id: mockPlatform.id,
                },
                type: PrincipalType.USER,
            })

            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/git-repos',
                payload: request,
                headers: {
                    authorization: `Bearer ${token}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('should create a git repo', async () => {
            const { mockProject, mockOwner } = await mockAndSaveBasicSetup({
                platform: {
                },
                plan: {
                    environmentsEnabled: true,
                },
            })

            const request = {
                projectId: mockProject.id,
                remoteUrl: `git@${faker.internet.url()}`,
                sshPrivateKey: faker.hacker.noun(),
                branch: 'main',
                branchType: GitBranchType.PRODUCTION,
                slug: 'test-slug',
            }
            const token = await generateMockToken({
                id: mockOwner.id,
                
                type: PrincipalType.USER,
                platform: {
                    id: mockProject.platformId,
                },
            })

            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/git-repos',
                payload: request,
                headers: {
                    authorization: `Bearer ${token}`,
                },
            })
            const responseBody = response?.json()
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            expect(responseBody.sshPrivateKey).toBeUndefined()
            expect(responseBody.remoteUrl).toBe(request.remoteUrl)
            expect(responseBody.branch).toBe(request.branch)
            expect(responseBody.created).toBeDefined()
            expect(responseBody.updated).toBeDefined()
            expect(responseBody.id).toBeDefined()
            expect(responseBody.projectId).toBe(mockProject.id)
            expect(responseBody.slug).toBe('test-slug')
        })
    })

    describe('Delete API', () => {
        it('should delete a git repo', async () => {
            const { mockProject, mockOwner } = await mockAndSaveBasicSetup({
                platform: {
                },
                plan: {
                    environmentsEnabled: true,
                },
            })

            const mockGitRepo = createMockGitRepo({ projectId: mockProject.id })
            await db.save('git_repo', mockGitRepo)

            const token = await generateMockToken({
                id: mockOwner.id,
                
                type: PrincipalType.USER,
                platform: {
                    id: mockProject.platformId,
                },
            })

            const response = await app?.inject({
                method: 'DELETE',
                url: '/api/v1/git-repos/' + mockGitRepo.id,
                headers: {
                    authorization: `Bearer ${token}`,
                },
            })
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })
        it('should not allow delete git repo for other projects', async () => {
            const { mockPlatform, mockProject } = await mockAndSaveBasicSetup({
                platform: {
                },
                plan: {
                    environmentsEnabled: true,
                },
                user: {
                    platformRole: PlatformRole.MEMBER,
                },
            })
            const mockGitRepo = createMockGitRepo({ projectId: mockProject.id })
            await db.save('git_repo', [mockGitRepo])

            const { mockUser: mockUser2 } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })
            const mockProject2 = createMockProject({ platformId: mockPlatform.id, ownerId: mockUser2.id })
            await db.save('project', mockProject2)

            const token = await generateMockToken({
                id: mockUser2.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockProject.platformId,
                },
            })

            const response = await app?.inject({
                method: 'DELETE',
                url: '/api/v1/git-repos/' + mockGitRepo.id,
                headers: {
                    authorization: `Bearer ${token}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('List API', () => {
        it('should list return forbidden when api request wrong project', async () => {
            const { mockPlatform, mockProject, mockApiKey, mockOwner } = await mockAndSaveBasicSetupWithApiKey({
                platform: {
                },
                plan: {
                    environmentsEnabled: true,
                },
            })
            const { mockProject: mockProject3 } = await mockAndSaveBasicSetup({
                platform: {
                },
                plan: {
                    environmentsEnabled: true,
                },
            })

            const mockProject2 = createMockProject({ platformId: mockPlatform.id, ownerId: mockOwner.id })
            await db.save('project', [mockProject2])

            const mockGitRepo = createMockGitRepo({ projectId: mockProject.id })
            const mockGitRepo2 = createMockGitRepo({ projectId: mockProject2.id })
            await db.save('git_repo', [mockGitRepo, mockGitRepo2])

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/git-repos?projectId=' + mockProject3.id,
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
        it('should list return forbidden when user request wrong project', async () => {
            const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                platform: {
                },
                plan: {
                    environmentsEnabled: true,
                },
            })
            const { mockProject: mockProject3 } = await mockAndSaveBasicSetup({
                platform: {
                },
                plan: {
                    environmentsEnabled: true,
                },
            })

            const mockProject2 = createMockProject({ platformId: mockPlatform.id, ownerId: mockOwner.id })
            await db.save('project', [mockProject2])

            const mockGitRepo = createMockGitRepo({ projectId: mockProject.id })
            const mockGitRepo2 = createMockGitRepo({ projectId: mockProject2.id })
            await db.save('git_repo', [mockGitRepo, mockGitRepo2])

            const token = await generateMockToken({
                id: mockOwner.id,

                type: PrincipalType.USER,
                platform: {
                    id: mockProject.platformId,
                },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/git-repos?projectId=' + mockProject3.id,
                headers: {
                    authorization: `Bearer ${token}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
        it('should list a git repo', async () => {
            const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
                platform: {
                },
                plan: {
                    environmentsEnabled: true,
                },
            })

            const mockProject2 = createMockProject({ platformId: mockPlatform.id, ownerId: mockOwner.id })
            await db.save('project', [mockProject2])

            const mockGitRepo = createMockGitRepo({ projectId: mockProject.id })
            const mockGitRepo2 = createMockGitRepo({ projectId: mockProject2.id })
            await db.save('git_repo', [mockGitRepo, mockGitRepo2])

            const token = await generateMockToken({
                id: mockOwner.id,

                type: PrincipalType.USER,
                platform: {
                    id: mockProject.platformId,
                },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/git-repos?projectId=' + mockProject.id,
                headers: {
                    authorization: `Bearer ${token}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()
            expect(responseBody.data.length).toBe(1)

            const gitRepo = responseBody.data[0]
            expect(gitRepo.sshPrivateKey).toBeUndefined()
            expect(gitRepo.remoteUrl).toBe(mockGitRepo.remoteUrl)
            expect(gitRepo.branch).toBe(mockGitRepo.branch)
            expect(gitRepo.created).toBeDefined()
            expect(gitRepo.updated).toBeDefined()
            expect(gitRepo.id).toBeDefined()
            expect(gitRepo.projectId).toBe(mockProject.id)
            expect(gitRepo.slug).toBe(mockGitRepo.slug)
        })
    })

    describe('Create API — path-traversal hardening', () => {
        async function postCreate(payload: unknown): Promise<{ statusCode: number }> {
            const { mockProject, mockOwner } = await mockAndSaveBasicSetup({
                platform: {},
                plan: { environmentsEnabled: true },
            })
            const token = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                platform: { id: mockProject.platformId },
            })
            const body = {
                projectId: mockProject.id,
                remoteUrl: 'git@github.com:activepieces/test.git',
                sshPrivateKey: faker.hacker.noun(),
                branch: 'main',
                branchType: GitBranchType.PRODUCTION,
                slug: 'safe-slug',
                ...(payload as Record<string, unknown>),
            }
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/git-repos',
                payload: body,
                headers: { authorization: `Bearer ${token}` },
            })
            return { statusCode: response?.statusCode ?? 0 }
        }

        const MALICIOUS_SLUGS: Array<[string, string]> = [
            ['..', 'parent directory reference'],
            ['.', 'current directory reference'],
            ['', 'empty string'],
            ['../test', 'relative traversal'],
            ['../../etc/passwd', 'deep relative traversal'],
            ['foo/bar', 'forward slash'],
            ['foo\\bar', 'backslash'],
            ['with\0null', 'null byte'],
            ['a b', 'space'],
            ['../../../../tmp/pwned', 'many-dot traversal'],
            ['a'.repeat(200), 'over length limit'],
        ]

        it.each(MALICIOUS_SLUGS)('should reject slug %j (%s)', async (slug) => {
            const { statusCode } = await postCreate({ slug })
            expect(statusCode).toBe(StatusCodes.BAD_REQUEST)
        })

        const SAFE_SLUGS = [
            'safe-slug',
            'project_1',
            'activepieces',
            'a',
            'dot.inside.name',
            'UPPER-lower.123',
        ]

        it.each(SAFE_SLUGS)('should accept slug %j', async (slug) => {
            const { statusCode } = await postCreate({ slug })
            expect(statusCode).toBe(StatusCodes.CREATED)
        })

        const MALICIOUS_BRANCHES: Array<[string, string]> = [
            ['--upload-pack=evil', 'option-like branch'],
            ['-M', 'single-dash option'],
            ['', 'empty string'],
            ['foo\0bar', 'null byte'],
            ['branch with space', 'whitespace'],
        ]

        it.each(MALICIOUS_BRANCHES)('should reject branch %j (%s)', async (branch) => {
            const { statusCode } = await postCreate({ branch })
            expect(statusCode).toBe(StatusCodes.BAD_REQUEST)
        })

        const SAFE_BRANCHES = ['main', 'feature/add-thing', 'release-1.2.3', 'user_a/topic']

        it.each(SAFE_BRANCHES)('should accept branch %j', async (branch) => {
            const { statusCode } = await postCreate({ branch })
            expect(statusCode).toBe(StatusCodes.CREATED)
        })

        const MALICIOUS_REMOTE_URLS: Array<[string, string]> = [
            ['git@bogus', 'missing colon'],
            ['https://github.com/foo/bar.git', 'http protocol'],
            ['file:///etc/passwd', 'file protocol'],
            ['ext::sh -c evil', 'ext transport'],
            ['', 'empty string'],
            ['git@host:path with space', 'whitespace'],
        ]

        it.each(MALICIOUS_REMOTE_URLS)('should reject remoteUrl %j (%s)', async (remoteUrl) => {
            const { statusCode } = await postCreate({ remoteUrl })
            expect(statusCode).toBe(StatusCodes.BAD_REQUEST)
        })

        const SAFE_REMOTE_URLS = [
            'git@github.com:activepieces/test.git',
            'git@gitlab.com:group/subgroup/project',
            'git@bitbucket.org:team/repo.git',
        ]

        it.each(SAFE_REMOTE_URLS)('should accept remoteUrl %j', async (remoteUrl) => {
            const { statusCode } = await postCreate({ remoteUrl })
            expect(statusCode).toBe(StatusCodes.CREATED)
        })
    })
})
