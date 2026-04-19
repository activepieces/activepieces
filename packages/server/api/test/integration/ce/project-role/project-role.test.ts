import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    DefaultProjectRole,
    ErrorCode,
    PrincipalType,
} from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import {
    createMockProjectRole,
    mockAndSaveBasicSetup,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Project Role API (CE)', () => {
    describe('List Project Roles', () => {
        it('should list default project roles', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/project-roles',
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()
            const roleNames = responseBody.data.map((r: { name: string }) => r.name)
            expect(roleNames).toContain(DefaultProjectRole.ADMIN)
            expect(roleNames).toContain(DefaultProjectRole.EDITOR)
            expect(roleNames).toContain(DefaultProjectRole.VIEWER)
        })
    })

    describe('Create Project Role', () => {
        it('should fail with FEATURE_DISABLED because customRolesEnabled is false', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const projectRole = createMockProjectRole({ platformId: mockPlatform.id })

            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/project-roles',
                body: projectRole,
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
            expect(response?.json()?.code).toBe(ErrorCode.FEATURE_DISABLED)
        })
    })

    describe('Update Project Role', () => {
        it('should fail with FEATURE_DISABLED because customRolesEnabled is false', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            const projectRole = createMockProjectRole({ platformId: mockPlatform.id })
            await db.save('project_role', projectRole)

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'POST',
                url: `/api/v1/project-roles/${projectRole.id}`,
                body: {
                    name: faker.lorem.word(),
                    permissions: ['read', 'write'],
                },
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
            expect(response?.json()?.code).toBe(ErrorCode.FEATURE_DISABLED)
        })
    })

    describe('Delete Project Role', () => {
        it('should fail with FEATURE_DISABLED because customRolesEnabled is false', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            const projectRole = createMockProjectRole({ platformId: mockPlatform.id })
            await db.save('project_role', projectRole)

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/project-roles/${projectRole.name}`,
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
            expect(response?.json()?.code).toBe(ErrorCode.FEATURE_DISABLED)
        })
    })
})
