import {
    DefaultProjectRole,
    Platform,
    PlatformPlan,
    PlatformRole,
    PrincipalType,
    Project,
    ProjectRole,
    User,
    UserIdentity,
} from '@activepieces/shared'
import { FastifyInstance, InjectOptions } from 'fastify'
import { generateMockToken } from './auth'
import { db } from './db'
import {
    createMockApiKey,
    createMockProjectMember,
    mockAndSaveBasicSetup,
    mockBasicUser,
} from './mocks'

export async function createTestContext(app: FastifyInstance, params?: TestContextParams): Promise<TestContext> {
    const { mockUserIdentity, mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup({
        platform: params?.platform,
        plan: params?.plan,
        project: params?.project,
    })

    const token = await generateMockToken({
        id: mockOwner.id,
        type: PrincipalType.USER,
        platform: { id: mockPlatform.id },
    })

    return buildContext(app, {
        userIdentity: mockUserIdentity,
        user: mockOwner,
        platform: mockPlatform,
        project: mockProject,
        token,
    })
}

export async function createMemberContext(
    app: FastifyInstance,
    parentCtx: TestContext,
    params: MemberContextParams,
): Promise<TestContext> {
    const { mockUser, mockUserIdentity } = await mockBasicUser({
        user: {
            platformId: parentCtx.platform.id,
            platformRole: PlatformRole.MEMBER,
        },
    })

    const projectRole = await db.findOneByOrFail<ProjectRole>('project_role', {
        name: params.projectRole,
    })

    const mockProjectMember = createMockProjectMember({
        userId: mockUser.id,
        platformId: parentCtx.platform.id,
        projectId: parentCtx.project.id,
        projectRoleId: projectRole.id,
    })
    await db.save('project_member', mockProjectMember)

    const token = await generateMockToken({
        id: mockUser.id,
        type: PrincipalType.USER,
        platform: { id: parentCtx.platform.id },
    })

    return buildContext(app, {
        userIdentity: mockUserIdentity,
        user: mockUser,
        platform: parentCtx.platform,
        project: parentCtx.project,
        token,
    })
}

export async function createServiceContext(
    app: FastifyInstance,
    parentCtx: TestContext,
): Promise<TestContext> {
    const mockApiKey = createMockApiKey({
        platformId: parentCtx.platform.id,
    })
    await db.save('api_key', mockApiKey)

    return buildContext(app, {
        userIdentity: parentCtx.userIdentity,
        user: parentCtx.user,
        platform: parentCtx.platform,
        project: parentCtx.project,
        token: mockApiKey.value,
    })
}

function buildContext(app: FastifyInstance, data: ContextData): TestContext {
    const makeRequest = (method: string) => {
        return (url: string, bodyOrQuery?: Record<string, unknown>, opts?: RequestOptions) => {
            const inject: InjectOptions = {
                method: method as InjectOptions['method'],
                url,
                headers: {
                    authorization: `Bearer ${data.token}`,
                },
            }
            if (method === 'GET' || method === 'DELETE') {
                if (bodyOrQuery) {
                    inject.query = bodyOrQuery as Record<string, string>
                }
            }
            else {
                inject.body = bodyOrQuery
            }
            if (opts?.query) {
                inject.query = opts.query as Record<string, string>
            }
            return app.inject(inject)
        }
    }

    return {
        userIdentity: data.userIdentity,
        user: data.user,
        platform: data.platform,
        project: data.project,
        token: data.token,
        get: makeRequest('GET'),
        post: makeRequest('POST'),
        put: makeRequest('PUT'),
        delete: makeRequest('DELETE'),
        inject: (opts: InjectOptions) => {
            return app.inject({
                ...opts,
                headers: {
                    authorization: `Bearer ${data.token}`,
                    ...opts.headers,
                },
            })
        },
    }
}

export type TestContextParams = {
    platform?: Partial<Platform>
    plan?: Partial<PlatformPlan>
    project?: Partial<Project>
}

type MemberContextParams = {
    projectRole: DefaultProjectRole | string
}

type RequestOptions = {
    query?: Record<string, string>
}

type ContextData = {
    userIdentity: UserIdentity
    user: User
    platform: Platform
    project: Project
    token: string
}

export type TestContext = {
    userIdentity: UserIdentity
    user: User
    platform: Platform
    project: Project
    token: string
    get: (url: string, query?: Record<string, unknown>, opts?: RequestOptions) => ReturnType<FastifyInstance['inject']>
    post: (url: string, body?: Record<string, unknown>, opts?: RequestOptions) => ReturnType<FastifyInstance['inject']>
    put: (url: string, body?: Record<string, unknown>, opts?: RequestOptions) => ReturnType<FastifyInstance['inject']>
    delete: (url: string, query?: Record<string, unknown>, opts?: RequestOptions) => ReturnType<FastifyInstance['inject']>
    inject: (opts: InjectOptions) => ReturnType<FastifyInstance['inject']>
}
