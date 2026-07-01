import { apId } from '@activepieces/core-utils'
import { PieceSet, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { generateMockToken } from '../../../helpers/auth'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function setupPlatformWithPieceSets() {
    const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup({
        plan: { managePiecesEnabled: true },
    })
    const token = await generateMockToken({
        type: PrincipalType.USER,
        id: mockOwner.id,
        platform: { id: mockPlatform.id },
    })
    return { mockOwner, mockPlatform, mockProject, token }
}

async function setupPlatformWithoutPieceSets() {
    const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
        plan: { managePiecesEnabled: false },
    })
    const token = await generateMockToken({
        type: PrincipalType.USER,
        id: mockOwner.id,
        platform: { id: mockPlatform.id },
    })
    return { mockOwner, mockPlatform, token }
}

const emptyConfig = { disabledPieces: [], disabledActions: {}, disabledTriggers: {}, curatedPieces: [] }

describe('Piece Sets API', () => {
    describe('Feature Gate', () => {
        it('returns 402 when managePiecesEnabled is false', async () => {
            const { token } = await setupPlatformWithoutPieceSets()
            const response = await app!.inject({
                method: 'GET',
                url: '/api/v1/piece-sets',
                headers: { authorization: `Bearer ${token}` },
            })
            expect(response.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        })
    })

    describe('List', () => {
        it('returns empty list when no sets exist', async () => {
            const { token } = await setupPlatformWithPieceSets()
            const response = await app!.inject({
                method: 'GET',
                url: '/api/v1/piece-sets',
                headers: { authorization: `Bearer ${token}` },
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(Array.isArray(body.data)).toBe(true)
            expect(body.data.length).toBe(0)
        })

        it('returns created sets', async () => {
            const { token } = await setupPlatformWithPieceSets()
            await app!.inject({
                method: 'POST',
                url: '/api/v1/piece-sets',
                headers: { authorization: `Bearer ${token}` },
                body: { name: 'My Set' },
            })
            const response = await app!.inject({
                method: 'GET',
                url: '/api/v1/piece-sets',
                headers: { authorization: `Bearer ${token}` },
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.data.length).toBe(1)
            expect(body.data[0].name).toBe('My Set')
        })
    })

    describe('Create', () => {
        it('creates a piece set with defaults', async () => {
            const { token } = await setupPlatformWithPieceSets()
            const response = await app!.inject({
                method: 'POST',
                url: '/api/v1/piece-sets',
                headers: { authorization: `Bearer ${token}` },
                body: { name: 'Engineering' },
            })
            expect(response.statusCode).toBe(StatusCodes.CREATED)
            const body = response.json<PieceSet>()
            expect(body.name).toBe('Engineering')
            expect(body.isDefault).toBe(false)
            expect(body.includeNewPieces).toBe(true)
            expect(body.config).toEqual(emptyConfig)
        })

        it('creates a piece set with externalId', async () => {
            const { token } = await setupPlatformWithPieceSets()
            const response = await app!.inject({
                method: 'POST',
                url: '/api/v1/piece-sets',
                headers: { authorization: `Bearer ${token}` },
                body: { name: 'Sales', externalId: 'sales-set' },
            })
            expect(response.statusCode).toBe(StatusCodes.CREATED)
            expect(response.json<PieceSet>().externalId).toBe('sales-set')
        })
    })

    describe('Get', () => {
        it('returns 404 for unknown id', async () => {
            const { token } = await setupPlatformWithPieceSets()
            const response = await app!.inject({
                method: 'GET',
                url: `/api/v1/piece-sets/${apId()}`,
                headers: { authorization: `Bearer ${token}` },
            })
            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('returns the piece set by id', async () => {
            const { token } = await setupPlatformWithPieceSets()
            const created = await app!.inject({
                method: 'POST',
                url: '/api/v1/piece-sets',
                headers: { authorization: `Bearer ${token}` },
                body: { name: 'Finance' },
            })
            const id = created.json<PieceSet>().id
            const response = await app!.inject({
                method: 'GET',
                url: `/api/v1/piece-sets/${id}`,
                headers: { authorization: `Bearer ${token}` },
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json<PieceSet>().id).toBe(id)
        })
    })

    describe('Update', () => {
        it('applies piece enable/disable patch ops', async () => {
            const { token } = await setupPlatformWithPieceSets()
            const created = await app!.inject({
                method: 'POST',
                url: '/api/v1/piece-sets',
                headers: { authorization: `Bearer ${token}` },
                body: { name: 'Ops' },
            })
            const id = created.json<PieceSet>().id

            const response = await app!.inject({
                method: 'POST',
                url: `/api/v1/piece-sets/${id}`,
                headers: { authorization: `Bearer ${token}` },
                body: {
                    disablePieces: ['@activepieces/piece-gmail'],
                },
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json<PieceSet>()
            expect(body.config.disabledPieces).toContain('@activepieces/piece-gmail')
            expect(body.config.disabledPieces).not.toContain('@activepieces/piece-slack')

            const reenabledResponse = await app!.inject({
                method: 'POST',
                url: `/api/v1/piece-sets/${id}`,
                headers: { authorization: `Bearer ${token}` },
                body: {
                    enablePieces: ['@activepieces/piece-gmail'],
                },
            })
            expect(reenabledResponse.statusCode).toBe(StatusCodes.OK)
            expect(reenabledResponse.json<PieceSet>().config.disabledPieces).not.toContain('@activepieces/piece-gmail')
        })

        it('toggling includeNewPieces does not modify existing disabled pieces', async () => {
            const { token } = await setupPlatformWithPieceSets()
            const created = await app!.inject({
                method: 'POST',
                url: '/api/v1/piece-sets',
                headers: { authorization: `Bearer ${token}` },
                body: { name: 'Toggle Test', includeNewPieces: true },
            })
            const id = created.json<PieceSet>().id

            await app!.inject({
                method: 'POST',
                url: `/api/v1/piece-sets/${id}`,
                headers: { authorization: `Bearer ${token}` },
                body: { disablePieces: ['@activepieces/piece-slack'] },
            })

            const response = await app!.inject({
                method: 'POST',
                url: `/api/v1/piece-sets/${id}`,
                headers: { authorization: `Bearer ${token}` },
                body: { includeNewPieces: false },
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json<PieceSet>()
            // Only the explicitly disabled piece remains; no backfill of other pieces
            expect(body.config.disabledPieces).toEqual(['@activepieces/piece-slack'])
            expect(body.includeNewPieces).toBe(false)
        })

        it('curating a piece marks it closed and disabling actions is preserved', async () => {
            const { token } = await setupPlatformWithPieceSets()
            const created = await app!.inject({
                method: 'POST',
                url: '/api/v1/piece-sets',
                headers: { authorization: `Bearer ${token}` },
                body: { name: 'Action Toggle' },
            })
            const id = created.json<PieceSet>().id

            const response = await app!.inject({
                method: 'POST',
                url: `/api/v1/piece-sets/${id}`,
                headers: { authorization: `Bearer ${token}` },
                body: {
                    curatePieces: ['@activepieces/piece-slack'],
                    disableActions: { '@activepieces/piece-slack': ['send-message'] },
                },
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json<PieceSet>()
            expect(body.config.curatedPieces).toEqual(['@activepieces/piece-slack'])
            expect(body.config.disabledActions['@activepieces/piece-slack']).toEqual(['send-message'])
            expect(body.config.disabledTriggers).toEqual({})
        })

        it('uncurating a piece reopens it and clears its disabled actions and triggers', async () => {
            const { token } = await setupPlatformWithPieceSets()
            const created = await app!.inject({
                method: 'POST',
                url: '/api/v1/piece-sets',
                headers: { authorization: `Bearer ${token}` },
                body: { name: 'Reopen' },
            })
            const id = created.json<PieceSet>().id

            await app!.inject({
                method: 'POST',
                url: `/api/v1/piece-sets/${id}`,
                headers: { authorization: `Bearer ${token}` },
                body: {
                    curatePieces: ['@activepieces/piece-slack'],
                    disableActions: { '@activepieces/piece-slack': ['send-message'] },
                },
            })

            const response = await app!.inject({
                method: 'POST',
                url: `/api/v1/piece-sets/${id}`,
                headers: { authorization: `Bearer ${token}` },
                body: { uncuratePieces: ['@activepieces/piece-slack'] },
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json<PieceSet>()
            expect(body.config.curatedPieces).toEqual([])
            expect(body.config.disabledActions).toEqual({})
            expect(body.config.disabledTriggers).toEqual({})
        })
    })

    describe('Delete', () => {
        it('rejects deletion of a default piece set', async () => {
            const { token, mockPlatform } = await setupPlatformWithPieceSets()
            const defaultSet = await databaseConnection().getRepository('piece_set').save({
                id: apId(),
                platformId: mockPlatform.id,
                name: 'Default',
                externalId: null,
                isDefault: true,
                includeNewPieces: true,
                generatedForProjectId: null,
                config: emptyConfig,
            })
            const response = await app!.inject({
                method: 'DELETE',
                url: `/api/v1/piece-sets/${defaultSet.id}`,
                headers: { authorization: `Bearer ${token}` },
            })
            expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        })

        it('deletes a non-default piece set and reassigns projects to default', async () => {
            const { token, mockPlatform, mockProject } = await setupPlatformWithPieceSets()

            const defaultSet = await databaseConnection().getRepository('piece_set').save({
                id: apId(),
                platformId: mockPlatform.id,
                name: 'Default',
                externalId: null,
                isDefault: true,
                includeNewPieces: true,
                generatedForProjectId: null,
                config: emptyConfig,
            })

            const otherSet = (await app!.inject({
                method: 'POST',
                url: '/api/v1/piece-sets',
                headers: { authorization: `Bearer ${token}` },
                body: { name: 'Other' },
            })).json<PieceSet>()

            await databaseConnection().getRepository('project').update(
                { id: mockProject.id },
                { pieceSetId: otherSet.id },
            )

            const deleteResponse = await app!.inject({
                method: 'DELETE',
                url: `/api/v1/piece-sets/${otherSet.id}`,
                headers: { authorization: `Bearer ${token}` },
            })
            expect(deleteResponse.statusCode).toBe(StatusCodes.NO_CONTENT)

            const project = await databaseConnection().getRepository('project').findOneByOrFail({ id: mockProject.id })
            expect((project as { pieceSetId: string }).pieceSetId).toBe(defaultSet.id)
        })
    })

    describe('Duplicate', () => {
        it('creates a copy without project assignments', async () => {
            const { token } = await setupPlatformWithPieceSets()
            const original = (await app!.inject({
                method: 'POST',
                url: '/api/v1/piece-sets',
                headers: { authorization: `Bearer ${token}` },
                body: {
                    name: 'Original',
                    includeNewPieces: false,
                },
            })).json<PieceSet>()

            await app!.inject({
                method: 'POST',
                url: `/api/v1/piece-sets/${original.id}`,
                headers: { authorization: `Bearer ${token}` },
                body: { disablePieces: ['@activepieces/piece-slack'] },
            })

            const response = await app!.inject({
                method: 'POST',
                url: `/api/v1/piece-sets/${original.id}/duplicate`,
                headers: { authorization: `Bearer ${token}` },
                body: { name: 'Original (Copy)' },
            })
            expect(response.statusCode).toBe(StatusCodes.CREATED)
            const clone = response.json<PieceSet>()
            expect(clone.name).toBe('Original (Copy)')
            expect(clone.isDefault).toBe(false)
            expect(clone.externalId).toBeNull()
            expect(clone.generatedForProjectId).toBeNull()
            expect(clone.id).not.toBe(original.id)
            expect(clone.includeNewPieces).toBe(false)
            expect(clone.config.disabledPieces).toContain('@activepieces/piece-slack')
        })
    })

    describe('Project Post-Create Hook', () => {
        it('assigns default piece set to newly created project when managePiecesEnabled', async () => {
            const { token, mockPlatform } = await setupPlatformWithPieceSets()

            const createResponse = await app!.inject({
                method: 'POST',
                url: '/api/v1/projects',
                headers: { authorization: `Bearer ${token}` },
                body: { displayName: 'Hook Test Project', externalId: null, metadata: null, maxConcurrentJobs: null },
            })
            expect(createResponse.statusCode).toBe(StatusCodes.CREATED)
            const project = createResponse.json<{ id: string }>()

            const defaultSet = await databaseConnection().getRepository('piece_set').findOneBy({ platformId: mockPlatform.id, isDefault: true })
            expect(defaultSet).not.toBeNull()

            const savedProject = await databaseConnection().getRepository('project').findOneByOrFail({ id: project.id })
            expect((savedProject as { pieceSetId: string }).pieceSetId).toBe(defaultSet!.id)
        })

        it('does not assign piece set when managePiecesEnabled is false', async () => {
            const { token } = await setupPlatformWithoutPieceSets()

            const createResponse = await app!.inject({
                method: 'POST',
                url: '/api/v1/projects',
                headers: { authorization: `Bearer ${token}` },
                body: { displayName: 'No PieceSet Project', externalId: null, metadata: null, maxConcurrentJobs: null },
            })
            expect(createResponse.statusCode).toBe(StatusCodes.CREATED)
            const project = createResponse.json<{ id: string }>()

            const savedProject = await databaseConnection().getRepository('project').findOneByOrFail({ id: project.id })
            expect((savedProject as { pieceSetId: string | null }).pieceSetId).toBeNull()
        })
    })

    describe('Assign / Remove Projects', () => {
        it('assigns a project to a piece set', async () => {
            const { token, mockPlatform, mockProject } = await setupPlatformWithPieceSets()
            const set = (await app!.inject({
                method: 'POST',
                url: '/api/v1/piece-sets',
                headers: { authorization: `Bearer ${token}` },
                body: { name: 'Assign Test' },
            })).json<PieceSet>()

            const response = await app!.inject({
                method: 'POST',
                url: `/api/v1/piece-sets/${set.id}/projects`,
                headers: { authorization: `Bearer ${token}` },
                body: { projectIds: [mockProject.id] },
            })
            expect(response.statusCode).toBe(StatusCodes.NO_CONTENT)

            const project = await databaseConnection().getRepository('project').findOneByOrFail({ id: mockProject.id })
            expect((project as { pieceSetId: string }).pieceSetId).toBe(set.id)
        })

        it('rejects removing project from the default piece set', async () => {
            const { token, mockPlatform, mockProject } = await setupPlatformWithPieceSets()
            const defaultSet = await databaseConnection().getRepository('piece_set').save({
                id: apId(),
                platformId: mockPlatform.id,
                name: 'Default',
                externalId: null,
                isDefault: true,
                includeNewPieces: true,
                generatedForProjectId: null,
                config: emptyConfig,
            })
            const response = await app!.inject({
                method: 'DELETE',
                url: `/api/v1/piece-sets/${defaultSet.id}/projects/${mockProject.id}`,
                headers: { authorization: `Bearer ${token}` },
            })
            expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        })
    })
})
