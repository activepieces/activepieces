import {
    apId,
    PlatformPlan,
    PlatformRole,
    PrincipalType,
    TemplateType,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    CLOUD_PLATFORM_ID,
    createMockTemplate,
    mockAndSaveBasicSetup,
    mockBasicUser,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Flow Templates', () => {
    describe('List Flow Templates', () => {
        it('should list platform templates only', async () => {
            // arrange
            const { mockPlatform, mockUser, mockPlatformTemplate } =
                await createMockPlatformTemplate({ platformId: apId(), plan: { manageTemplatesEnabled: true } })

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/v1/flow-templates',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.data).toHaveLength(1)
            expect(responseBody.data[0].id).toBe(mockPlatformTemplate.id)
        })

        it('should list cloud platform template for anonymous users', async () => {
            // arrange
            const { mockPlatformTemplate } = await createMockPlatformTemplate({
                platformId: CLOUD_PLATFORM_ID,
            })
            await createMockPlatformTemplate({
                platformId: apId(),
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/v1/flow-templates',
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()
            expect(responseBody.data).toHaveLength(1)
            expect(responseBody.data[0].id).toBe(mockPlatformTemplate.id)
        })
    })

    describe('Create Flow Template', () => {
        it('should create a flow template', async () => {
            // arrange
            const { mockPlatform, mockOwner, mockProject } = await mockAndSaveBasicSetup({
                platform: {
                },
                plan: {
                    manageTemplatesEnabled: true,
                },
            })

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const mockTemplate = createMockTemplate({
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                type: TemplateType.PLATFORM,
            })

            const createTemplateRequest = {
                description: mockTemplate.description,
                template: mockTemplate.template,
                blogUrl: mockTemplate.blogUrl,
                type: TemplateType.PLATFORM,
                tags: mockTemplate.tags,
                metadata: {
                    foo: 'bar',
                },
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/flow-templates',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
                body: createTemplateRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const responseBody = response?.json()
            expect(responseBody.metadata).toEqual({ foo: 'bar' })
        })
    })

    describe('Delete Flow Template', () => {
        it('should not be able delete platform template as member', async () => {
            // arrange
            const { mockUser, mockPlatform, mockPlatformTemplate } =
                await createMockPlatformTemplate({ platformId: apId() })
            const testToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/flow-templates/${mockPlatformTemplate.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('should be able delete platform template as owner', async () => {
            // arrange
            const { mockPlatform, mockOwner, mockPlatformTemplate } =
                await createMockPlatformTemplate({ platformId: apId() })

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/flow-templates/${mockPlatformTemplate.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })

        it('should not delete platform template when not authenticated', async () => {
            // arrange
            const { mockPlatformTemplate } = await createMockPlatformTemplate({
                platformId: CLOUD_PLATFORM_ID,
            })

            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/flow-templates/${mockPlatformTemplate.id}`,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})

async function createMockPlatformTemplate({ platformId, plan }: { platformId: string, plan?: Partial<PlatformPlan> }) {
    const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup({
        platform: {
            id: platformId,
        },
        plan: {
            manageTemplatesEnabled: true,
            ...plan,
        },
    })

    const mockPlatformTemplate = createMockTemplate({
        platformId: mockPlatform.id,
        projectId: mockProject.id,
        type: TemplateType.PLATFORM,
    })
    await databaseConnection()
        .getRepository('flow_template')
        .save(mockPlatformTemplate)

    const { mockUser } = await mockBasicUser({
        user: {
            platformId: mockPlatform.id,
            platformRole: PlatformRole.MEMBER,
        },
    })
    return { mockOwner, mockUser, mockPlatform, mockProject, mockPlatformTemplate }
}
