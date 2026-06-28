import { apId } from '@activepieces/core-utils'
import { ActionBase } from '@activepieces/pieces-framework'
import { DefaultProjectRole, FlowTriggerType, PackageType, PieceType, PrincipalType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { pieceCache } from '../../../../src/app/pieces/metadata/piece-cache'
import { pieceMetadataService } from '../../../../src/app/pieces/metadata/piece-metadata-service'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import {
    createMockFlow,
    createMockFlowVersion,
    createMockPieceMetadata,
} from '../../../helpers/mocks'
import { createMemberContext, createTestContext } from '../../../helpers/test-context'
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

beforeEach(async () => {
    await databaseConnection().getRepository('piece_metadata').createQueryBuilder().delete().execute()
})

describe('Piece Metadata CE API', () => {
    describe('GET /v1/pieces/categories', () => {
        it('should return piece categories', async () => {
            const testToken = await generateMockToken({
                type: PrincipalType.UNKNOWN,
                id: apId(),
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/pieces/categories',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(Array.isArray(body)).toBe(true)
        })
    })

    describe('GET /v1/pieces (List)', () => {
        it('should list pieces', async () => {
            const mockPiece = createMockPieceMetadata({
                name: 'ce-list-test-piece',
                pieceType: PieceType.OFFICIAL,
                displayName: 'CE List Test',
                packageType: PackageType.REGISTRY,
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const testToken = await generateMockToken({
                type: PrincipalType.UNKNOWN,
                id: apId(),
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/pieces',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(Array.isArray(body)).toBe(true)
            expect(body).toHaveLength(1)
            expect(body[0].name).toBe('ce-list-test-piece')
        })

        it('should filter pieces by searchQuery', async () => {
            const mockPieceA = createMockPieceMetadata({
                name: 'searchable-unique-piece',
                pieceType: PieceType.OFFICIAL,
                displayName: 'Searchable Unique Piece',
                packageType: PackageType.REGISTRY,
            })
            const mockPieceB = createMockPieceMetadata({
                name: 'other-piece-xyz',
                pieceType: PieceType.OFFICIAL,
                displayName: 'Other Piece XYZ',
                packageType: PackageType.REGISTRY,
            })
            await db.save('piece_metadata', [mockPieceA, mockPieceB])
            await pieceCache(mockLog).setup()

            const testToken = await generateMockToken({
                type: PrincipalType.UNKNOWN,
                id: apId(),
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/pieces?searchQuery=Searchable+Unique',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body).toHaveLength(1)
            expect(body[0].name).toBe('searchable-unique-piece')
        })
    })

    describe('GET /v1/pieces/:name', () => {
        it('should get piece by name', async () => {
            const mockPiece = createMockPieceMetadata({
                name: 'ce-get-test-piece',
                pieceType: PieceType.OFFICIAL,
                displayName: 'CE Get Test',
                packageType: PackageType.REGISTRY,
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const testToken = await generateMockToken({
                type: PrincipalType.UNKNOWN,
                id: apId(),
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/pieces/ce-get-test-piece',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.name).toBe('ce-get-test-piece')
            expect(body.displayName).toBe('CE Get Test')
        })

        it('should return 404 for non-existent piece', async () => {
            await pieceCache(mockLog).setup()

            const testToken = await generateMockToken({
                type: PrincipalType.UNKNOWN,
                id: apId(),
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/pieces/non-existent-piece-xyz',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('GET /v1/pieces/:scope/:name', () => {
        it('should get piece by scope and name', async () => {
            const ctx = await createTestContext(app!)

            const mockPiece = createMockPieceMetadata({
                name: '@activepieces/ce-scoped-piece',
                pieceType: PieceType.OFFICIAL,
                displayName: 'CE Scoped Test',
                packageType: PackageType.REGISTRY,
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const response = await ctx.get(`/v1/pieces/@activepieces/ce-scoped-piece?projectId=${ctx.project.id}`)

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.name).toBe('@activepieces/ce-scoped-piece')
        })
    })

    describe('POST /v1/pieces/sync', () => {
        it('should sync pieces as platform admin', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.post('/v1/pieces/sync', {})

            // Sync should succeed (200) or be accepted
            expect([StatusCodes.OK, StatusCodes.NO_CONTENT]).toContain(response?.statusCode)
        })
    })

    describe('release-compatibility fallback', () => {
        it('GET /v1/pieces/:scope/:name falls back to the newest compatible version when latest requires a newer release', async () => {
            const compatible = createMockPieceMetadata({
                name: '@activepieces/piece-release-test',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                version: '0.1.32',
                minimumSupportedRelease: '0.0.0',
                maximumSupportedRelease: '99999.99999.9999',
            })
            const incompatible = createMockPieceMetadata({
                name: '@activepieces/piece-release-test',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                version: '0.1.33',
                minimumSupportedRelease: '99.0.0',
                maximumSupportedRelease: '99999.99999.9999',
            })
            await db.save('piece_metadata', [compatible, incompatible])
            await pieceCache(mockLog).setup()

            const ctx = await createTestContext(app!)
            const response = await ctx.get('/v1/pieces/@activepieces/piece-release-test')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().version).toBe('0.1.32')
        })

        it('GET /v1/pieces returns the newest compatible version in list when latest is incompatible', async () => {
            const compatible = createMockPieceMetadata({
                name: 'list-release-test-piece',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                version: '0.1.32',
                minimumSupportedRelease: '0.0.0',
                maximumSupportedRelease: '99999.99999.9999',
            })
            const incompatible = createMockPieceMetadata({
                name: 'list-release-test-piece',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                version: '0.1.33',
                minimumSupportedRelease: '99.0.0',
                maximumSupportedRelease: '99999.99999.9999',
            })
            await db.save('piece_metadata', [compatible, incompatible])
            await pieceCache(mockLog).setup()

            const testToken = await generateMockToken({
                type: PrincipalType.UNKNOWN,
                id: apId(),
            })
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/pieces',
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const entry = response?.json().find((p: { name: string }) => p.name === 'list-release-test-piece')
            expect(entry).toBeDefined()
            expect(entry.version).toBe('0.1.32')
        })

        it('GET /v1/pieces/:scope/:name returns 404 when all versions are incompatible', async () => {
            const incompatible = createMockPieceMetadata({
                name: '@activepieces/piece-all-incompatible',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                version: '0.1.33',
                minimumSupportedRelease: '99.0.0',
                maximumSupportedRelease: '99999.99999.9999',
            })
            await db.save('piece_metadata', incompatible)
            await pieceCache(mockLog).setup()

            const ctx = await createTestContext(app!)
            const response = await ctx.get('/v1/pieces/@activepieces/piece-all-incompatible')

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describe('DELETE /v1/pieces/:id', () => {
        it('should delete a custom piece owned by the platform', async () => {
            const ctx = await createTestContext(app!)
            const mockPiece = createMockPieceMetadata({
                name: '@custom/deletable-piece',
                pieceType: PieceType.CUSTOM,
                packageType: PackageType.REGISTRY,
                platformId: ctx.platform.id,
                version: '0.1.0',
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const response = await ctx.delete(`/v1/pieces/${mockPiece.id}`)

            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
            const remaining = await databaseConnection().getRepository('piece_metadata').findOneBy({ id: mockPiece.id })
            expect(remaining).toBeNull()
        })

        it('should return 404 for a non-existent piece id', async () => {
            const ctx = await createTestContext(app!)
            await pieceCache(mockLog).setup()

            const response = await ctx.delete(`/v1/pieces/${apId()}`)

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('should delete all versions of the custom piece', async () => {
            const ctx = await createTestContext(app!)
            const versionOne = createMockPieceMetadata({
                name: '@custom/multi-version-piece',
                pieceType: PieceType.CUSTOM,
                packageType: PackageType.REGISTRY,
                platformId: ctx.platform.id,
                version: '0.1.0',
            })
            const versionTwo = createMockPieceMetadata({
                name: '@custom/multi-version-piece',
                pieceType: PieceType.CUSTOM,
                packageType: PackageType.REGISTRY,
                platformId: ctx.platform.id,
                version: '0.2.0',
            })
            await db.save('piece_metadata', [versionOne, versionTwo])
            await pieceCache(mockLog).setup()

            const response = await ctx.delete(`/v1/pieces/${versionTwo.id}`)

            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
            const remaining = await databaseConnection().getRepository('piece_metadata').findBy({ name: '@custom/multi-version-piece' })
            expect(remaining).toHaveLength(0)
        })

        it('should reject deleting a platform-owned official piece with 403', async () => {
            const ctx = await createTestContext(app!)
            const mockPiece = createMockPieceMetadata({
                name: '@activepieces/official-piece',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                platformId: ctx.platform.id,
                version: '0.1.0',
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const response = await ctx.delete(`/v1/pieces/${mockPiece.id}`)

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            const remaining = await databaseConnection().getRepository('piece_metadata').findOneBy({ id: mockPiece.id })
            expect(remaining).not.toBeNull()
        })

        it('should reject deletion by a non-admin platform member with 403', async () => {
            const ownerCtx = await createTestContext(app!)
            const memberCtx = await createMemberContext(app!, ownerCtx, {
                projectRole: DefaultProjectRole.EDITOR,
            })
            const mockPiece = createMockPieceMetadata({
                name: '@custom/member-cannot-delete',
                pieceType: PieceType.CUSTOM,
                packageType: PackageType.REGISTRY,
                platformId: ownerCtx.platform.id,
                version: '0.1.0',
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const response = await memberCtx.delete(`/v1/pieces/${mockPiece.id}`)

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
            const remaining = await databaseConnection().getRepository('piece_metadata').findOneBy({ id: mockPiece.id })
            expect(remaining).not.toBeNull()
        })

        it('should not delete a custom piece owned by another platform', async () => {
            const ctx = await createTestContext(app!)
            const mockPiece = createMockPieceMetadata({
                name: '@custom/other-platform-piece',
                pieceType: PieceType.CUSTOM,
                packageType: PackageType.REGISTRY,
                platformId: apId(),
                version: '0.1.0',
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const response = await ctx.delete(`/v1/pieces/${mockPiece.id}`)

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
            const remaining = await databaseConnection().getRepository('piece_metadata').findOneBy({ id: mockPiece.id })
            expect(remaining).not.toBeNull()
        })

        it('should reject deleting a custom piece that is still used by a flow', async () => {
            const ctx = await createTestContext(app!)
            const mockPiece = createMockPieceMetadata({
                name: '@custom/in-use-piece',
                pieceType: PieceType.CUSTOM,
                packageType: PackageType.REGISTRY,
                platformId: ctx.platform.id,
                version: '0.1.0',
            })
            await db.save('piece_metadata', mockPiece)
            const mockFlow = createMockFlow({ projectId: ctx.project.id })
            await db.save('flow', mockFlow)
            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: ctx.user.id,
                displayName: 'My Webhook Flow',
                trigger: {
                    type: FlowTriggerType.PIECE,
                    name: 'trigger',
                    settings: {
                        pieceName: mockPiece.name,
                        pieceVersion: mockPiece.version,
                        input: {},
                        propertySettings: {},
                        triggerName: 'sample_trigger',
                    },
                    valid: true,
                    displayName: 'Trigger',
                },
            })
            await db.save('flow_version', mockFlowVersion)
            await pieceCache(mockLog).setup()

            const response = await ctx.delete(`/v1/pieces/${mockPiece.id}`)

            expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
            expect(response?.json().params.message).toContain('My Webhook Flow')
            const remaining = await databaseConnection().getRepository('piece_metadata').findOneBy({ id: mockPiece.id })
            expect(remaining).not.toBeNull()
        })

        it('should allow deleting a custom piece that is only referenced by a stale flow version', async () => {
            const ctx = await createTestContext(app!)
            const mockPiece = createMockPieceMetadata({
                name: '@custom/stale-version-piece',
                pieceType: PieceType.CUSTOM,
                packageType: PackageType.REGISTRY,
                platformId: ctx.platform.id,
                version: '0.1.0',
            })
            await db.save('piece_metadata', mockPiece)
            const mockFlow = createMockFlow({ projectId: ctx.project.id })
            await db.save('flow', mockFlow)
            const staleVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: ctx.user.id,
                created: '2020-01-01T00:00:00.000Z',
                trigger: {
                    type: FlowTriggerType.PIECE,
                    name: 'trigger',
                    settings: {
                        pieceName: mockPiece.name,
                        pieceVersion: mockPiece.version,
                        input: {},
                        propertySettings: {},
                        triggerName: 'sample_trigger',
                    },
                    valid: true,
                    displayName: 'Trigger',
                },
            })
            const latestVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                updatedBy: ctx.user.id,
                created: '2024-01-01T00:00:00.000Z',
            })
            await db.save('flow_version', [staleVersion, latestVersion])
            await pieceCache(mockLog).setup()

            const response = await ctx.delete(`/v1/pieces/${mockPiece.id}`)

            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
            const remaining = await databaseConnection().getRepository('piece_metadata').findOneBy({ id: mockPiece.id })
            expect(remaining).toBeNull()
        })

        it('should allow deleting a custom piece used only by a flow in another platform', async () => {
            const ctx = await createTestContext(app!)
            const otherCtx = await createTestContext(app!)
            const mockPiece = createMockPieceMetadata({
                name: '@custom/cross-platform-usage-piece',
                pieceType: PieceType.CUSTOM,
                packageType: PackageType.REGISTRY,
                platformId: ctx.platform.id,
                version: '0.1.0',
            })
            await db.save('piece_metadata', mockPiece)
            const otherFlow = createMockFlow({ projectId: otherCtx.project.id })
            await db.save('flow', otherFlow)
            const otherFlowVersion = createMockFlowVersion({
                flowId: otherFlow.id,
                updatedBy: otherCtx.user.id,
                trigger: {
                    type: FlowTriggerType.PIECE,
                    name: 'trigger',
                    settings: {
                        pieceName: mockPiece.name,
                        pieceVersion: mockPiece.version,
                        input: {},
                        propertySettings: {},
                        triggerName: 'sample_trigger',
                    },
                    valid: true,
                    displayName: 'Trigger',
                },
            })
            await db.save('flow_version', otherFlowVersion)
            await pieceCache(mockLog).setup()

            const response = await ctx.delete(`/v1/pieces/${mockPiece.id}`)

            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
            const remaining = await databaseConnection().getRepository('piece_metadata').findOneBy({ id: mockPiece.id })
            expect(remaining).toBeNull()
        })
    })

    describe('pieceMetadataService.get() — custom pieces', () => {
        it('should return undefined for custom piece when platformId is not provided', async () => {
            const platformId = apId()
            const mockPiece = createMockPieceMetadata({
                name: '@custom/my-piece',
                pieceType: PieceType.CUSTOM,
                packageType: PackageType.REGISTRY,
                platformId,
                version: '0.1.0',
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const result = await pieceMetadataService(mockLog).get({
                name: '@custom/my-piece',
                version: '0.1.0',
            })
            expect(result).toBeUndefined()
        })

        it('should return custom piece when platformId is provided', async () => {
            const platformId = apId()
            const mockPiece = createMockPieceMetadata({
                name: '@custom/my-piece',
                pieceType: PieceType.CUSTOM,
                packageType: PackageType.REGISTRY,
                platformId,
                version: '0.1.0',
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const result = await pieceMetadataService(mockLog).get({
                name: '@custom/my-piece',
                version: '0.1.0',
                platformId,
            })
            expect(result).toBeDefined()
            expect(result?.name).toBe('@custom/my-piece')
        })
    })

    describe('audience filtering (canvas filter)', () => {
        // Covers all three audience values; `both` and untagged actions must stay visible in
        // both the human and ai perspectives — only the opposite single audience is hidden.
        const buildActions = (): Record<string, ActionBase> => ({
            human_only_action: { name: 'human_only_action', displayName: 'Human Only', description: 'human only action', props: {}, requireAuth: false, audience: 'human' },
            both_action: { name: 'both_action', displayName: 'Both Action', description: 'both audiences action', props: {}, requireAuth: false, audience: 'both' },
            untagged_action: { name: 'untagged_action', displayName: 'Untagged Action', description: 'untagged action', props: {}, requireAuth: false },
            ai_action: { name: 'ai_action', displayName: 'AI Action', description: 'ai only action', props: {}, requireAuth: false, audience: 'ai' },
        })

        it('GET /v1/pieces/:name hides audience:ai by default and keeps both + untagged', async () => {
            const mockPiece = createMockPieceMetadata({
                name: 'audience-detail-piece',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                actions: buildActions(),
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const testToken = await generateMockToken({ type: PrincipalType.UNKNOWN, id: apId() })
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/pieces/audience-detail-piece',
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(Object.keys(body.actions).sort()).toEqual(['both_action', 'human_only_action', 'untagged_action'])
            expect(body.actions).not.toHaveProperty('ai_action')
        })

        it('GET /v1/pieces/:name?audience=all returns every action', async () => {
            const mockPiece = createMockPieceMetadata({
                name: 'audience-detail-piece',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                actions: buildActions(),
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const testToken = await generateMockToken({ type: PrincipalType.UNKNOWN, id: apId() })
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/pieces/audience-detail-piece?audience=all',
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(Object.keys(body.actions).sort()).toEqual(['ai_action', 'both_action', 'human_only_action', 'untagged_action'])
        })

        it('GET /v1/pieces/:name?audience=ai hides human-only and keeps ai + both + untagged', async () => {
            const mockPiece = createMockPieceMetadata({
                name: 'audience-detail-piece',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                actions: buildActions(),
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const testToken = await generateMockToken({ type: PrincipalType.UNKNOWN, id: apId() })
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/pieces/audience-detail-piece?audience=ai',
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(Object.keys(body.actions).sort()).toEqual(['ai_action', 'both_action', 'untagged_action'])
            expect(body.actions).not.toHaveProperty('human_only_action')
        })

        it('GET /v1/pieces/:scope/:name hides audience:ai by default', async () => {
            const ctx = await createTestContext(app!)
            const mockPiece = createMockPieceMetadata({
                name: '@activepieces/audience-scoped-piece',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                actions: buildActions(),
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const response = await ctx.get('/v1/pieces/@activepieces/audience-scoped-piece')

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(Object.keys(body.actions).sort()).toEqual(['both_action', 'human_only_action', 'untagged_action'])
            expect(body.actions).not.toHaveProperty('ai_action')
        })

        it('GET /v1/pieces hides audience:ai from suggestedActions and recomputes the count by default', async () => {
            const mockPiece = createMockPieceMetadata({
                name: 'audience-list-piece',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                actions: buildActions(),
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const testToken = await generateMockToken({ type: PrincipalType.UNKNOWN, id: apId() })
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/pieces?suggestionType=ACTION',
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const entry = response?.json().find((p: { name: string }) => p.name === 'audience-list-piece')
            expect(entry).toBeDefined()
            const suggestedNames = entry.suggestedActions.map((a: { name: string }) => a.name).sort()
            expect(suggestedNames).toEqual(['both_action', 'human_only_action', 'untagged_action'])
            expect(entry.actions).toBe(3)
        })

        it('GET /v1/pieces?audience=all keeps every action and the full count', async () => {
            const mockPiece = createMockPieceMetadata({
                name: 'audience-list-piece',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                actions: buildActions(),
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const testToken = await generateMockToken({ type: PrincipalType.UNKNOWN, id: apId() })
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/pieces?suggestionType=ACTION&audience=all',
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const entry = response?.json().find((p: { name: string }) => p.name === 'audience-list-piece')
            expect(entry).toBeDefined()
            const suggestedNames = entry.suggestedActions.map((a: { name: string }) => a.name).sort()
            expect(suggestedNames).toEqual(['ai_action', 'both_action', 'human_only_action', 'untagged_action'])
            expect(entry.actions).toBe(4)
        })

        it('GET /v1/pieces (no suggestionType) reports an audience-filtered action count by default', async () => {
            const mockPiece = createMockPieceMetadata({
                name: 'audience-bare-list-piece',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                actions: buildActions(),
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const testToken = await generateMockToken({ type: PrincipalType.UNKNOWN, id: apId() })
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/pieces',
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const entry = response?.json().find((p: { name: string }) => p.name === 'audience-bare-list-piece')
            expect(entry).toBeDefined()
            expect(entry.suggestedActions).toBeUndefined()
            expect(entry.actions).toBe(3)
        })

        it('GET /v1/pieces?audience=all (no suggestionType) reports the full action count', async () => {
            const mockPiece = createMockPieceMetadata({
                name: 'audience-bare-list-piece',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
                actions: buildActions(),
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const testToken = await generateMockToken({ type: PrincipalType.UNKNOWN, id: apId() })
            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/pieces?audience=all',
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const entry = response?.json().find((p: { name: string }) => p.name === 'audience-bare-list-piece')
            expect(entry).toBeDefined()
            expect(entry.actions).toBe(4)
        })
    })
})
