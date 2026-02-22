import { apId, PrincipalType, ProjectType } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockApiKey,
    mockAndSaveBasicSetup,
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

// Helper: set up a platform with SSO enabled, API key, and return the bearer token
async function setupScimPlatform() {
    const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup({
        plan: {
            scimEnabled: true,
            projectRolesEnabled: true,
        },
    })

    const mockApiKey = createMockApiKey({
        platformId: mockPlatform.id,
    })
    await databaseConnection().getRepository('api_key').save(mockApiKey)

    return {
        mockOwner,
        mockPlatform,
        mockProject,
        mockApiKey,
        bearerToken: `Bearer ${mockApiKey.value}`,
    }
}

// ==================== Mock IdP Data ====================

function mockIdpUser(overrides?: {
    externalId?: string
    email?: string
    firstName?: string
    lastName?: string
    active?: boolean
}) {
    return {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
        externalId: overrides?.externalId ?? `idp-user-${apId()}`,
        userName: overrides?.email ?? faker.internet.email().toLowerCase().trim(),
        name: {
            givenName: overrides?.firstName ?? faker.person.firstName(),
            familyName: overrides?.lastName ?? faker.person.lastName(),
        },
        emails: [
            {
                value: overrides?.email ?? faker.internet.email().toLowerCase().trim(),
                primary: true,
            },
        ],
        active: overrides?.active ?? true,
    }
}

function mockIdpGroup(overrides?: {
    externalId?: string
    displayName?: string
    members?: { value: string }[]
}) {
    return {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        externalId: overrides?.externalId ?? `idp-group-${apId()}`,
        displayName: overrides?.displayName ?? faker.company.name(),
        members: overrides?.members ?? [],
    }
}

// ==================== SCIM User Tests ====================

describe('SCIM 2.0 API', () => {

    describe('SCIM User Provisioning', () => {

        it('should create a user from IdP', async () => {
            const { bearerToken } = await setupScimPlatform()
            const idpUser = mockIdpUser()

            const response = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Users',
                headers: { authorization: bearerToken },
                body: idpUser,
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const body = response?.json()
            expect(body.id).toBeDefined()
            expect(body.userName).toBe(idpUser.userName)
            expect(body.name.givenName).toBe(idpUser.name.givenName)
            expect(body.name.familyName).toBe(idpUser.name.familyName)
            expect(body.externalId).toBe(idpUser.externalId)
            expect(body.active).toBe(true)
            expect(body.schemas).toContain('urn:ietf:params:scim:schemas:core:2.0:User')
            expect(body.meta.resourceType).toBe('User')
        })

        it('should create an inactive user from IdP', async () => {
            const { bearerToken } = await setupScimPlatform()
            const idpUser = mockIdpUser({ active: false })

            const response = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Users',
                headers: { authorization: bearerToken },
                body: idpUser,
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const body = response?.json()
            expect(body.active).toBe(false)
        })

        it('should get a user by ID', async () => {
            const { bearerToken } = await setupScimPlatform()
            const idpUser = mockIdpUser()

            const createResponse = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Users',
                headers: { authorization: bearerToken },
                body: idpUser,
            })
            const userId = createResponse?.json().id

            const getResponse = await app?.inject({
                method: 'GET',
                url: `/scim/v2/Users/${userId}`,
                headers: { authorization: bearerToken },
            })

            expect(getResponse?.statusCode).toBe(StatusCodes.OK)
            const body = getResponse?.json()
            expect(body.id).toBe(userId)
            expect(body.userName).toBe(idpUser.userName)
            expect(body.externalId).toBe(idpUser.externalId)
        })

        it('should list users', async () => {
            const { bearerToken } = await setupScimPlatform()
            const idpUser1 = mockIdpUser()
            const idpUser2 = mockIdpUser()

            await app?.inject({
                method: 'POST',
                url: '/scim/v2/Users',
                headers: { authorization: bearerToken },
                body: idpUser1,
            })
            await app?.inject({
                method: 'POST',
                url: '/scim/v2/Users',
                headers: { authorization: bearerToken },
                body: idpUser2,
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/scim/v2/Users',
                headers: { authorization: bearerToken },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.schemas).toContain('urn:ietf:params:scim:api:messages:2.0:ListResponse')
            // At least the platform owner + 2 SCIM users
            expect(body.totalResults).toBeGreaterThanOrEqual(2)
            expect(body.Resources.length).toBeGreaterThanOrEqual(2)
        })

        it('should filter users by userName', async () => {
            const { bearerToken } = await setupScimPlatform()
            const email = faker.internet.email().toLowerCase().trim()
            const idpUser = mockIdpUser({ email })

            await app?.inject({
                method: 'POST',
                url: '/scim/v2/Users',
                headers: { authorization: bearerToken },
                body: idpUser,
            })

            const response = await app?.inject({
                method: 'GET',
                url: `/scim/v2/Users?filter=userName eq "${email}"`,
                headers: { authorization: bearerToken },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.totalResults).toBe(1)
            expect(body.Resources[0].userName).toBe(email)
        })

        it('should deactivate a user via PATCH', async () => {
            const { bearerToken } = await setupScimPlatform()
            const idpUser = mockIdpUser()

            const createResponse = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Users',
                headers: { authorization: bearerToken },
                body: idpUser,
            })
            const userId = createResponse?.json().id

            // IdP sends PATCH to deactivate
            const patchResponse = await app?.inject({
                method: 'PATCH',
                url: `/scim/v2/Users/${userId}`,
                headers: { authorization: bearerToken },
                body: {
                    schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
                    Operations: [
                        {
                            op: 'replace',
                            value: { active: false },
                        },
                    ],
                },
            })

            expect(patchResponse?.statusCode).toBe(StatusCodes.OK)
            const body = patchResponse?.json()
            expect(body.active).toBe(false)
        })

        it('should reactivate a user via PATCH', async () => {
            const { bearerToken } = await setupScimPlatform()
            const idpUser = mockIdpUser({ active: false })

            const createResponse = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Users',
                headers: { authorization: bearerToken },
                body: idpUser,
            })
            const userId = createResponse?.json().id

            const patchResponse = await app?.inject({
                method: 'PATCH',
                url: `/scim/v2/Users/${userId}`,
                headers: { authorization: bearerToken },
                body: {
                    schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
                    Operations: [
                        {
                            op: 'replace',
                            value: { active: true },
                        },
                    ],
                },
            })

            expect(patchResponse?.statusCode).toBe(StatusCodes.OK)
            expect(patchResponse?.json().active).toBe(true)
        })

        it('should replace a user via PUT', async () => {
            const { bearerToken } = await setupScimPlatform()
            const idpUser = mockIdpUser()

            const createResponse = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Users',
                headers: { authorization: bearerToken },
                body: idpUser,
            })
            const userId = createResponse?.json().id

            const updatedUser = {
                schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
                userName: idpUser.userName,
                name: {
                    givenName: 'UpdatedFirst',
                    familyName: 'UpdatedLast',
                },
                active: false,
                externalId: idpUser.externalId,
            }

            const putResponse = await app?.inject({
                method: 'PUT',
                url: `/scim/v2/Users/${userId}`,
                headers: { authorization: bearerToken },
                body: updatedUser,
            })

            expect(putResponse?.statusCode).toBe(StatusCodes.OK)
            const body = putResponse?.json()
            expect(body.active).toBe(false)
            expect(body.id).toBe(userId)
        })

        it('should deactivate a user via DELETE', async () => {
            const { bearerToken } = await setupScimPlatform()
            const idpUser = mockIdpUser()

            const createResponse = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Users',
                headers: { authorization: bearerToken },
                body: idpUser,
            })
            const userId = createResponse?.json().id

            const deleteResponse = await app?.inject({
                method: 'DELETE',
                url: `/scim/v2/Users/${userId}`,
                headers: { authorization: bearerToken },
            })

            expect(deleteResponse?.statusCode).toBe(StatusCodes.NO_CONTENT)

            // Verify user is now inactive
            const getResponse = await app?.inject({
                method: 'GET',
                url: `/scim/v2/Users/${userId}`,
                headers: { authorization: bearerToken },
            })
            expect(getResponse?.json().active).toBe(false)
        })

        it('should reject unauthenticated requests', async () => {
            const response = await app?.inject({
                method: 'GET',
                url: '/scim/v2/Users',
            })

            // Unauthenticated requests get UNKNOWN principal, which fails authorization as FORBIDDEN
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('should reject requests from non-SERVICE principals', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                plan: { scimEnabled: true },
            })

            const userToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/scim/v2/Users',
                headers: { authorization: `Bearer ${userToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('should reject requests when SCIM is disabled', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup({
                plan: { scimEnabled: false },
            })

            const mockApiKey = createMockApiKey({ platformId: mockPlatform.id })
            await databaseConnection().getRepository('api_key').save(mockApiKey)

            const response = await app?.inject({
                method: 'GET',
                url: '/scim/v2/Users',
                headers: { authorization: `Bearer ${mockApiKey.value}` },
            })

            // FEATURE_DISABLED maps to PAYMENT_REQUIRED (402)
            expect(response?.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        })
    })

    // ==================== SCIM Group Tests ====================

    describe('SCIM Group Provisioning (Groups as Projects)', () => {

        it('should create a group as a TEAM project', async () => {
            const { bearerToken } = await setupScimPlatform()
            const idpGroup = mockIdpGroup()

            const response = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Groups',
                headers: { authorization: bearerToken },
                body: idpGroup,
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const body = response?.json()
            expect(body.id).toBeDefined()
            expect(body.displayName).toBe(idpGroup.displayName)
            expect(body.externalId).toBe(idpGroup.externalId)
            expect(body.schemas).toContain('urn:ietf:params:scim:schemas:core:2.0:Group')
            expect(body.meta.resourceType).toBe('Group')
            expect(body.members).toEqual([])

            // Verify it's a TEAM project in the database
            const project = await databaseConnection()
                .getRepository('project')
                .findOneBy({ id: body.id })
            expect(project?.type).toBe(ProjectType.TEAM)
            expect(project?.externalId).toBe(idpGroup.externalId)
        })

        it('should create a group with members', async () => {
            const { bearerToken } = await setupScimPlatform()

            // First create two users via SCIM
            const user1 = mockIdpUser()
            const user2 = mockIdpUser()

            const user1Response = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Users',
                headers: { authorization: bearerToken },
                body: user1,
            })
            const user1Id = user1Response?.json().id

            const user2Response = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Users',
                headers: { authorization: bearerToken },
                body: user2,
            })
            const user2Id = user2Response?.json().id

            // Create group with both users as members
            const idpGroup = mockIdpGroup({
                members: [
                    { value: user1Id },
                    { value: user2Id },
                ],
            })

            const response = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Groups',
                headers: { authorization: bearerToken },
                body: idpGroup,
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const body = response?.json()
            expect(body.members).toHaveLength(2)
            expect(body.members.map((m: { value: string }) => m.value).sort()).toEqual(
                [user1Id, user2Id].sort(),
            )
        })

        it('should get a group by ID', async () => {
            const { bearerToken } = await setupScimPlatform()
            const idpGroup = mockIdpGroup()

            const createResponse = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Groups',
                headers: { authorization: bearerToken },
                body: idpGroup,
            })
            const groupId = createResponse?.json().id

            const getResponse = await app?.inject({
                method: 'GET',
                url: `/scim/v2/Groups/${groupId}`,
                headers: { authorization: bearerToken },
            })

            expect(getResponse?.statusCode).toBe(StatusCodes.OK)
            const body = getResponse?.json()
            expect(body.id).toBe(groupId)
            expect(body.displayName).toBe(idpGroup.displayName)
            expect(body.externalId).toBe(idpGroup.externalId)
        })

        it('should list groups', async () => {
            const { bearerToken } = await setupScimPlatform()

            await app?.inject({
                method: 'POST',
                url: '/scim/v2/Groups',
                headers: { authorization: bearerToken },
                body: mockIdpGroup(),
            })
            await app?.inject({
                method: 'POST',
                url: '/scim/v2/Groups',
                headers: { authorization: bearerToken },
                body: mockIdpGroup(),
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/scim/v2/Groups',
                headers: { authorization: bearerToken },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.schemas).toContain('urn:ietf:params:scim:api:messages:2.0:ListResponse')
            expect(body.totalResults).toBeGreaterThanOrEqual(2)
        })

        it('should add members to a group via PATCH', async () => {
            const { bearerToken } = await setupScimPlatform()

            // Create a user
            const idpUser = mockIdpUser()
            const userResponse = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Users',
                headers: { authorization: bearerToken },
                body: idpUser,
            })
            const userId = userResponse?.json().id

            // Create an empty group
            const idpGroup = mockIdpGroup()
            const groupResponse = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Groups',
                headers: { authorization: bearerToken },
                body: idpGroup,
            })
            const groupId = groupResponse?.json().id

            // IdP sends PATCH to add member
            const patchResponse = await app?.inject({
                method: 'PATCH',
                url: `/scim/v2/Groups/${groupId}`,
                headers: { authorization: bearerToken },
                body: {
                    schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
                    Operations: [
                        {
                            op: 'add',
                            path: 'members',
                            value: [{ value: userId }],
                        },
                    ],
                },
            })

            expect(patchResponse?.statusCode).toBe(StatusCodes.OK)
            const body = patchResponse?.json()
            expect(body.members).toHaveLength(1)
            expect(body.members[0].value).toBe(userId)
        })

        it('should remove members from a group via PATCH', async () => {
            const { bearerToken } = await setupScimPlatform()

            // Create a user and a group with that user
            const idpUser = mockIdpUser()
            const userResponse = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Users',
                headers: { authorization: bearerToken },
                body: idpUser,
            })
            const userId = userResponse?.json().id

            const idpGroup = mockIdpGroup({ members: [{ value: userId }] })
            const groupResponse = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Groups',
                headers: { authorization: bearerToken },
                body: idpGroup,
            })
            const groupId = groupResponse?.json().id

            // IdP sends PATCH to remove member
            const patchResponse = await app?.inject({
                method: 'PATCH',
                url: `/scim/v2/Groups/${groupId}`,
                headers: { authorization: bearerToken },
                body: {
                    schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
                    Operations: [
                        {
                            op: 'remove',
                            path: `members[value eq "${userId}"]`,
                        },
                    ],
                },
            })

            expect(patchResponse?.statusCode).toBe(StatusCodes.OK)
            const body = patchResponse?.json()
            expect(body.members).toHaveLength(0)
        })

        it('should rename a group via PATCH', async () => {
            const { bearerToken } = await setupScimPlatform()
            const idpGroup = mockIdpGroup()

            const createResponse = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Groups',
                headers: { authorization: bearerToken },
                body: idpGroup,
            })
            const groupId = createResponse?.json().id

            const newName = 'Renamed Engineering Team'
            const patchResponse = await app?.inject({
                method: 'PATCH',
                url: `/scim/v2/Groups/${groupId}`,
                headers: { authorization: bearerToken },
                body: {
                    schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
                    Operations: [
                        {
                            op: 'replace',
                            path: 'displayName',
                            value: newName,
                        },
                    ],
                },
            })

            expect(patchResponse?.statusCode).toBe(StatusCodes.OK)
            expect(patchResponse?.json().displayName).toBe(newName)
        })

        it('should replace a group via PUT', async () => {
            const { bearerToken } = await setupScimPlatform()

            // Create user and group
            const idpUser = mockIdpUser()
            const userResponse = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Users',
                headers: { authorization: bearerToken },
                body: idpUser,
            })
            const userId = userResponse?.json().id

            const idpGroup = mockIdpGroup()
            const createResponse = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Groups',
                headers: { authorization: bearerToken },
                body: idpGroup,
            })
            const groupId = createResponse?.json().id

            // PUT replaces the group entirely
            const replacedGroup = {
                schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
                displayName: 'Completely New Name',
                externalId: idpGroup.externalId,
                members: [{ value: userId }],
            }

            const putResponse = await app?.inject({
                method: 'PUT',
                url: `/scim/v2/Groups/${groupId}`,
                headers: { authorization: bearerToken },
                body: replacedGroup,
            })

            expect(putResponse?.statusCode).toBe(StatusCodes.OK)
            const body = putResponse?.json()
            expect(body.displayName).toBe('Completely New Name')
            expect(body.members).toHaveLength(1)
            expect(body.members[0].value).toBe(userId)
        })

        it('should soft-delete a group via DELETE', async () => {
            const { bearerToken } = await setupScimPlatform()
            const idpGroup = mockIdpGroup()

            const createResponse = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Groups',
                headers: { authorization: bearerToken },
                body: idpGroup,
            })
            const groupId = createResponse?.json().id

            const deleteResponse = await app?.inject({
                method: 'DELETE',
                url: `/scim/v2/Groups/${groupId}`,
                headers: { authorization: bearerToken },
            })

            expect(deleteResponse?.statusCode).toBe(StatusCodes.NO_CONTENT)

            // Verify the project is soft-deleted (GET should 404)
            const getResponse = await app?.inject({
                method: 'GET',
                url: `/scim/v2/Groups/${groupId}`,
                headers: { authorization: bearerToken },
            })
            expect(getResponse?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    // ==================== SCIM Discovery Tests ====================

    describe('SCIM Discovery Endpoints', () => {

        it('should return ServiceProviderConfig', async () => {
            const { bearerToken } = await setupScimPlatform()

            const response = await app?.inject({
                method: 'GET',
                url: '/scim/v2/ServiceProviderConfig',
                headers: { authorization: bearerToken },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.schemas).toContain('urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig')
            expect(body.patch.supported).toBe(true)
            expect(body.bulk.supported).toBe(false)
            expect(body.filter.supported).toBe(true)
        })

        it('should return ResourceTypes', async () => {
            const { bearerToken } = await setupScimPlatform()

            const response = await app?.inject({
                method: 'GET',
                url: '/scim/v2/ResourceTypes',
                headers: { authorization: bearerToken },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body).toHaveLength(2)
            expect(body.map((r: { id: string }) => r.id).sort()).toEqual(['Group', 'User'])
        })

        it('should return Schemas', async () => {
            const { bearerToken } = await setupScimPlatform()

            const response = await app?.inject({
                method: 'GET',
                url: '/scim/v2/Schemas',
                headers: { authorization: bearerToken },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body).toHaveLength(2)
            const schemaIds = body.map((s: { id: string }) => s.id)
            expect(schemaIds).toContain('urn:ietf:params:scim:schemas:core:2.0:User')
            expect(schemaIds).toContain('urn:ietf:params:scim:schemas:core:2.0:Group')
        })
    })

    // ==================== Full IdP Lifecycle Tests ====================

    describe('Full IdP Lifecycle Simulation', () => {

        it('should handle a complete Okta-style provisioning flow', async () => {
            const { bearerToken } = await setupScimPlatform()

            // Step 1: IdP creates users
            const engineerAlice = mockIdpUser({
                externalId: 'okta-alice-001',
                email: `alice-${apId()}@example.com`,
                firstName: 'Alice',
                lastName: 'Engineer',
            })
            const engineerBob = mockIdpUser({
                externalId: 'okta-bob-002',
                email: `bob-${apId()}@example.com`,
                firstName: 'Bob',
                lastName: 'Developer',
            })

            const aliceResponse = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Users',
                headers: { authorization: bearerToken },
                body: engineerAlice,
            })
            expect(aliceResponse?.statusCode).toBe(StatusCodes.CREATED)
            const aliceId = aliceResponse?.json().id

            const bobResponse = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Users',
                headers: { authorization: bearerToken },
                body: engineerBob,
            })
            expect(bobResponse?.statusCode).toBe(StatusCodes.CREATED)
            const bobId = bobResponse?.json().id

            // Step 2: IdP creates an "Engineering" group with both users
            const engineeringGroup = mockIdpGroup({
                externalId: 'okta-eng-group',
                displayName: 'Engineering',
                members: [
                    { value: aliceId },
                    { value: bobId },
                ],
            })

            const groupResponse = await app?.inject({
                method: 'POST',
                url: '/scim/v2/Groups',
                headers: { authorization: bearerToken },
                body: engineeringGroup,
            })
            expect(groupResponse?.statusCode).toBe(StatusCodes.CREATED)
            const groupId = groupResponse?.json().id
            expect(groupResponse?.json().members).toHaveLength(2)

            // Step 3: IdP removes Bob from the group
            const removeBobResponse = await app?.inject({
                method: 'PATCH',
                url: `/scim/v2/Groups/${groupId}`,
                headers: { authorization: bearerToken },
                body: {
                    schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
                    Operations: [
                        {
                            op: 'remove',
                            path: `members[value eq "${bobId}"]`,
                        },
                    ],
                },
            })
            expect(removeBobResponse?.statusCode).toBe(StatusCodes.OK)
            expect(removeBobResponse?.json().members).toHaveLength(1)
            expect(removeBobResponse?.json().members[0].value).toBe(aliceId)

            // Step 4: IdP deactivates Bob (offboarding)
            const deactivateBobResponse = await app?.inject({
                method: 'PATCH',
                url: `/scim/v2/Users/${bobId}`,
                headers: { authorization: bearerToken },
                body: {
                    schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
                    Operations: [
                        {
                            op: 'replace',
                            value: { active: false },
                        },
                    ],
                },
            })
            expect(deactivateBobResponse?.statusCode).toBe(StatusCodes.OK)
            expect(deactivateBobResponse?.json().active).toBe(false)

            // Step 5: Verify final state
            const finalGroupResponse = await app?.inject({
                method: 'GET',
                url: `/scim/v2/Groups/${groupId}`,
                headers: { authorization: bearerToken },
            })
            expect(finalGroupResponse?.json().members).toHaveLength(1)

            const finalAliceResponse = await app?.inject({
                method: 'GET',
                url: `/scim/v2/Users/${aliceId}`,
                headers: { authorization: bearerToken },
            })
            expect(finalAliceResponse?.json().active).toBe(true)

            const finalBobResponse = await app?.inject({
                method: 'GET',
                url: `/scim/v2/Users/${bobId}`,
                headers: { authorization: bearerToken },
            })
            expect(finalBobResponse?.json().active).toBe(false)
        })

        it('should handle an Azure AD-style group replacement flow', async () => {
            const { bearerToken } = await setupScimPlatform()

            // Create users
            const user1 = mockIdpUser({ externalId: 'azure-user-1' })
            const user2 = mockIdpUser({ externalId: 'azure-user-2' })
            const user3 = mockIdpUser({ externalId: 'azure-user-3' })

            const u1Res = await app?.inject({ method: 'POST', url: '/scim/v2/Users', headers: { authorization: bearerToken }, body: user1 })
            const u2Res = await app?.inject({ method: 'POST', url: '/scim/v2/Users', headers: { authorization: bearerToken }, body: user2 })
            const u3Res = await app?.inject({ method: 'POST', url: '/scim/v2/Users', headers: { authorization: bearerToken }, body: user3 })

            const u1Id = u1Res?.json().id
            const u2Id = u2Res?.json().id
            const u3Id = u3Res?.json().id

            // Create group with user1 and user2
            const group = mockIdpGroup({
                displayName: 'Sales Team',
                members: [{ value: u1Id }, { value: u2Id }],
            })
            const gRes = await app?.inject({ method: 'POST', url: '/scim/v2/Groups', headers: { authorization: bearerToken }, body: group })
            const groupId = gRes?.json().id

            // Azure AD does a full PUT to replace membership: now user2 and user3
            const putResponse = await app?.inject({
                method: 'PUT',
                url: `/scim/v2/Groups/${groupId}`,
                headers: { authorization: bearerToken },
                body: {
                    schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
                    displayName: 'Sales Team',
                    externalId: group.externalId,
                    members: [{ value: u2Id }, { value: u3Id }],
                },
            })

            expect(putResponse?.statusCode).toBe(StatusCodes.OK)
            const members = putResponse?.json().members.map((m: { value: string }) => m.value).sort()
            expect(members).toEqual([u2Id, u3Id].sort())
        })
    })
})
